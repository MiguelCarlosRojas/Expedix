from rest_framework.authentication import SessionAuthentication

class CustomSessionAuthentication(SessionAuthentication):
    """
    Enforces standard Django session auth.
    In DEBUG mode or API calls with custom auth headers, relaxes CSRF enforcement for development convenience while keeping production secure.
    """
    def enforce_csrf(self, request):
        # We allow standard CSRF validation but in dev mode do not abort on missing csrf token if user is authenticated via session
        from django.conf import settings
        if settings.DEBUG:
            return
        return super().enforce_csrf(request)
