import json
from .models import AuditLog

class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Log state-modifying requests for authenticated users
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE'] and hasattr(request, 'user') and request.user.is_authenticated:
            # Skip noise like auth ping or notification polling
            path = request.path
            if not any(x in path for x in ['/api/v1/auth/login/', '/api/v1/auth/logout/', '/api/v1/notifications/unread_count/']):
                try:
                    ip = request.META.get('HTTP_X_FORWARDED_FOR')
                    if ip:
                        ip = ip.split(',')[0].strip()
                    else:
                        ip = request.META.get('REMOTE_ADDR')

                    action = request.method
                    module = 'api'
                    parts = [p for p in path.strip('/').split('/') if p]
                    if len(parts) >= 3:
                        module = parts[2]

                    AuditLog.objects.create(
                        user=request.user,
                        action=action,
                        module=module,
                        record_id=path,
                        description=f"{action} en {path} (Status {response.status_code})",
                        ip_address=ip,
                        user_agent=request.META.get('HTTP_USER_AGENT', '')[:250]
                    )
                except Exception:
                    pass

        return response
