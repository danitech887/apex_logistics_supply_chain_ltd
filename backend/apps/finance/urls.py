from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.finance.views import (
    AccountViewSet,
    JournalEntryViewSet,
    InvoiceViewSet,
    FinancialReportView,
)

router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'journals', JournalEntryViewSet, basename='journal')
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('reports/', FinancialReportView.as_view(), name='financial-reports'),
    path('', include(router.urls)),
]
