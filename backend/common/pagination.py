"""
Unified Page-Number and Cursor Pagination for Apex Logistics Enterprise.
"""
from rest_framework.pagination import PageNumberPagination, CursorPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """
    Unified standard page number pagination with envelope metadata.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'status': 'success',
            'pagination': {
                'count': self.page.paginator.count,
                'total_pages': self.page.paginator.num_pages,
                'current_page': self.page.number,
                'next': self.get_next_link(),
                'previous': self.get_previous_link(),
                'page_size': self.get_page_size(self.request),
            },
            'results': data
        })


class RapidCursorPagination(CursorPagination):
    """
    Cursor-based pagination for high-throughput append-only feeds (e.g. Telematics, GPS, Logs).
    """
    page_size = 50
    cursor_query_param = 'cursor'
    ordering = '-created_at'

    def get_paginated_response(self, data):
        return Response({
            'status': 'success',
            'pagination': {
                'next': self.get_next_link(),
                'previous': self.get_previous_link(),
                'page_size': self.page_size,
            },
            'results': data
        })
