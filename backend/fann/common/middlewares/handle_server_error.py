import traceback
import sys
from django.http import JsonResponse

from django.conf import settings


class JSON500Middleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Check if the response is 500
        if response.status_code == 500:
            # Handle JSON formatting in Debug Mode
            if settings.DEBUG:
                exc_type, exc_value, exc_tb = sys.exc_info()
                error_details = {
                    "exception_type": (
                        str(exc_type.__name__) if exc_type else "Exception"
                    ),
                    "exception_value": str(exc_value),
                    "traceback": traceback.format_exception(
                        exc_type, exc_value, exc_tb
                    ),
                }
                return JsonResponse(
                    {
                        "status_code": 500,
                        "message": "Something went wrong. Error details.",
                        "error": error_details,
                    }
                )
            else:
                # Production Error Response
                return JsonResponse(
                    {
                        "status_code": 500,
                        "message": "An internal server error occurred.",
                    }
                )

        return response

    def process_exception(self, request, exception):
        if settings.DEBUG:
            exc_type, exc_value, exc_tb = sys.exc_info()
            error_details = {
                "exception_type": str(exc_type.__name__) if exc_type else "Exception",
                "exception_value": str(exc_value),
                "traceback": traceback.format_exception(exc_type, exc_value, exc_tb),
            }
            return JsonResponse(
                {
                    "status_code": 500,
                    "message": "Something went wrong. Error details.",
                    "error": error_details,
                }
            )
