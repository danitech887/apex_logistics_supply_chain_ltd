from rest_framework import serializers
from apps.hr_payroll.models import Employee, LeaveRequest, PayrollRun, Payslip
from apps.authentication.models import User, Role, UserRole, Tenant
from apps.authentication.serializers import UserProfileSerializer


class EmployeeSerializer(serializers.ModelSerializer):
    user_details = UserProfileSerializer(source='user', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)

    # Direct input fields for onboarding/updating the associated user account
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    email = serializers.EmailField(write_only=True, required=False)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'tenant', 'user', 'user_details', 'full_name',
            'first_name', 'last_name', 'email', 'phone_number', 'role',
            'staff_number', 'national_id', 'tax_pin', 'department',
            'designation', 'base_salary', 'hourly_rate', 'date_of_hire',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at']

    def create(self, validated_data):
        first_name = validated_data.pop('first_name', '').strip()
        last_name = validated_data.pop('last_name', '').strip()
        email = validated_data.pop('email', None)
        phone_number = validated_data.pop('phone_number', '').strip()
        role_code = validated_data.pop('role', '').strip()
        tenant = validated_data.get('tenant')
        user = validated_data.get('user')

        if not user:
            if not email:
                raise serializers.ValidationError({'email': 'Corporate email is required for employee onboarding.'})

            user, created = User.objects.get_or_create(
                email=email.strip().lower(),
                defaults={
                    'tenant': tenant,
                    'first_name': first_name or 'Staff',
                    'last_name': last_name or 'Member',
                    'phone_number': phone_number,
                    'is_active': True,
                }
            )
            if not created:
                if first_name:
                    user.first_name = first_name
                if last_name:
                    user.last_name = last_name
                if phone_number:
                    user.phone_number = phone_number
                user.save()
            else:
                user.set_password('password123')
                user.save()

            if role_code:
                role = Role.objects.filter(code=role_code).first()
                if role:
                    UserRole.objects.get_or_create(user=user, role=role)
            else:
                dept = validated_data.get('department', '').lower()
                assigned_code = 'DRIVER' if ('transit' in dept or 'fleet' in dept) else ('HR_OFFICER' if ('hr' in dept or 'human' in dept) else ('ACCOUNTANT' if 'fin' in dept else 'DRIVER'))
                role = Role.objects.filter(code=assigned_code).first()
                if role:
                    UserRole.objects.get_or_create(user=user, role=role)

            validated_data['user'] = user

        return super().create(validated_data)

    def update(self, instance, validated_data):
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        email = validated_data.pop('email', None)
        phone_number = validated_data.pop('phone_number', None)
        role_code = validated_data.pop('role', None)

        user = instance.user
        if user:
            updated_user = False
            if first_name is not None and first_name.strip():
                user.first_name = first_name.strip()
                updated_user = True
            if last_name is not None and last_name.strip():
                user.last_name = last_name.strip()
                updated_user = True
            if email is not None and email.strip():
                user.email = email.strip().lower()
                updated_user = True
            if phone_number is not None:
                user.phone_number = phone_number.strip()
                updated_user = True
            if updated_user:
                user.save()

            if role_code:
                role = Role.objects.filter(code=role_code).first()
                if role:
                    user.roles.clear()
                    UserRole.objects.create(user=user, role=role)

        return super().update(instance, validated_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        user = instance.user
        if user:
            ret['name'] = user.full_name
            ret['email'] = user.email
            ret['phone'] = user.phone_number or ''
            ret['first_name'] = user.first_name
            ret['last_name'] = user.last_name
            roles = list(user.roles.values_list('code', flat=True))
            ret['roles'] = roles
            ret['role'] = roles[0] if roles else 'EMPLOYEE'
        else:
            ret['name'] = ''
            ret['email'] = ''
            ret['phone'] = ''
            ret['first_name'] = ''
            ret['last_name'] = ''
            ret['roles'] = []
            ret['role'] = 'EMPLOYEE'

        ret['staffNumber'] = instance.staff_number
        ret['taxPin'] = instance.tax_pin
        ret['nationalId'] = instance.national_id
        ret['baseSalary'] = float(instance.base_salary)
        ret['hourlyRate'] = float(instance.hourly_rate)
        ret['dateOfHire'] = str(instance.date_of_hire)
        ret['status'] = 'AVAILABLE' if instance.is_active else 'INACTIVE'
        return ret


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    staff_number = serializers.CharField(source='employee.staff_number', read_only=True)
    department = serializers.CharField(source='employee.department', read_only=True)
    designation = serializers.CharField(source='employee.designation', read_only=True)
    phone_number = serializers.CharField(source='employee.user.phone_number', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True, allow_null=True)
    employee = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'tenant', 'employee', 'employee_name', 'staff_number',
            'department', 'designation', 'phone_number',
            'leave_type', 'start_date', 'end_date', 'days_requested',
            'reason', 'status', 'approved_by', 'approved_by_name',
            'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        start = attrs.get('start_date')
        end = attrs.get('end_date')
        if start and end and end < start:
            raise serializers.ValidationError({"end_date": "Resumption date cannot be prior to start date."})
        if start and end and not attrs.get('days_requested'):
            attrs['days_requested'] = (end - start).days + 1
        return attrs


class PayslipSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.full_name', read_only=True)
    staff_number = serializers.CharField(source='employee.staff_number', read_only=True)
    department = serializers.CharField(source='employee.department', read_only=True)
    tax_pin = serializers.CharField(source='employee.tax_pin', read_only=True)
    national_id = serializers.CharField(source='employee.national_id', read_only=True)
    period_start = serializers.CharField(source='payroll_run.period_start', read_only=True)
    period_end = serializers.CharField(source='payroll_run.period_end', read_only=True)

    class Meta:
        model = Payslip
        fields = [
            'id', 'payroll_run', 'employee', 'employee_name', 'staff_number',
            'department', 'tax_pin', 'national_id', 'period_start', 'period_end',
            'base_pay', 'allowances', 'deductions_tax',
            'deductions_statutory', 'net_pay', 'calculation_breakdown',
            'pdf_generated', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['base_pay'] = float(instance.base_pay)
        ret['allowances'] = float(instance.allowances)
        ret['deductions_tax'] = float(instance.deductions_tax)
        ret['deductions_statutory'] = float(instance.deductions_statutory)
        ret['net_pay'] = float(instance.net_pay)
        return ret


class PayrollRunSerializer(serializers.ModelSerializer):
    payslips_count = serializers.IntegerField(source='payslips.count', read_only=True)

    class Meta:
        model = PayrollRun
        fields = [
            'id', 'tenant', 'period_start', 'period_end', 'run_date',
            'status', 'total_gross', 'total_net', 'payslips_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['total_gross'] = float(instance.total_gross)
        ret['total_net'] = float(instance.total_net)
        return ret
