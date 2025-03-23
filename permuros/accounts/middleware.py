from collections.abc import Awaitable

from django.http import HttpRequest
from django.http.response import HttpResponseBase

from django_browser_reload.middleware import BrowserReloadMiddleware


class UserBrowserReloadMiddleware(BrowserReloadMiddleware):
    """
    BrowserReloadMiddleware, enabled by user
    """

    def __call__(
        self, request: HttpRequest
    ) -> HttpResponseBase | Awaitable[HttpResponseBase]:
        if request.user and request.user.settings.auto_reload:
            return super().__call__(request)
        else:
            return self.get_response(request)
