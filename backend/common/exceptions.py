"""
Global Standardized Error Response Handler for Apex Logistics Enterprise.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Standardizes error responses to maintain consistent payload contracts across all modules:
    {
        "status": "error",
        "error_type": "ValidationError",
        "message": "Human readable summary",
        "details": { ...field errors... },
        "status_code": 400
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_type = exc.__class__.__name__

        message = 'An operational or validation error occurred.'
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, str):
                message = exc.detail
            elif isinstance(exc.detail, list) and exc.detail:
                message = str(exc.detail[0])
            elif isinstance(exc.detail, dict):
                first_key = next(iter(exc.detail), None)
                if first_key and isinstance(exc.detail[first_key], list):
                    message = f"{first_key}: {exc.detail[first_key][0]}"
                else:
                    message = f"{first_key}: {exc.detail.get(first_key, '')}"

        custom_data = {
            'status': 'error',
            'error_type': error_type,
            'message': message,
            'details': response.data,
            'status_code': response.status_code,
        }
        response.data = custom_data
        return response

    # Unhandled internal exception fallback
    logger.exception(f"Unhandled server exception in API: {exc}", exc_info=exc)
    return Response(
        {
            'status': 'error',
            'error_type': 'InternalServerError',
            'message': 'An unexpected server error occurred. Our engineering team has been notified.',
            'details': str(exc) if context.get('request') and context['request'].user.is_superuser else None,
            'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
