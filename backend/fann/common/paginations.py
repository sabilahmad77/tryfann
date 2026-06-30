from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class CustomPagination(PageNumberPagination):
    def get_paginated_response(self, data):
        try:
            previous_page = self.page.previous_page_number()
        except:
            previous_page = 0

        return Response(
            {
                "next_page": self.page.next_page_number(),
                "prev_page": previous_page,
                "total_count": self.page.paginator.count,
                "current_page": self.page.next_page_number() - 1,
                "total_page": self.page.paginator.num_pages,
                "success": True,
                "data": data,
                "last_page": False,
            }
        )

    def get_last_page_data(self, data):
        try:
            previous_page = self.page.previous_page_number()
        except Exception as e:
            previous_page = 0

        return Response(
            {
                "next_page": self.page.paginator.num_pages,
                "prev_page": previous_page,
                "total_count": self.page.paginator.count,
                "current_page": self.page.paginator.num_pages,
                "total_page": self.page.paginator.num_pages,
                "success": True,
                "data": data,
                "last_page": True,
            }
        )
