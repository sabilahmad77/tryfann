from rest_framework import pagination, serializers
from rest_framework.pagination import PageNumberPagination
from math import ceil
from rest_framework.response import Response


class CustomPageNumberPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 5000

    def paginate_queryset(self, queryset, request, view=None):
        self.request = request

        page_size = request.query_params.get("page_size")

        if page_size:
            if page_size.isdigit():
                limit = int(page_size)

                if limit > self.max_page_size:
                    raise serializers.ValidationError(
                        {
                            "success": False,
                            "data": {},
                            "message": f"page_size should be <= {self.max_page_size}",
                            "errors": {},
                        }
                    )
                self.page_size = limit

            else:
                raise serializers.ValidationError(
                    {
                        "success": False,
                        "data": {},
                        "message": "Invalid page_size",
                        "errors": {},
                    }
                )

        return super().paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        total_count = self.page.paginator.count
        page_size = self.get_page_size(self.request)

        all_pages = ceil(total_count / page_size)
        current_page = self.page.number

        next_page = current_page + 1 if current_page < all_pages else None
        prev_page = current_page - 1 if current_page > 1 else None

        return Response(
            {
                "all_page": all_pages,
                "total_count": total_count,
                "next_page": self.get_page_url(next_page),
                "prev_page": self.get_page_url(prev_page),
                "success": True,
                "data": data,
                "last_page": current_page == all_pages,
            }
        )

    def get_page_url(self, page_number):
        if page_number is None:
            return None

        request = self.request
        page_size = request.query_params.get("page_size", self.page_size)

        url = request.build_absolute_uri().split("?")[0]
        return f"{url}?page={page_number}&page_size={page_size}"
