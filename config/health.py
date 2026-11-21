from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache

def health_check(request):
    """
    Lightweight health check endpoint for Kubernetes liveness/readiness probes and Render.
    Ensures services are alive without exposing sensitive credentials or internal structures.
    """
    status = {"status": "ok", "service": "expedix-api"}
    http_status = 200

    # Check Database connectivity
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        status["database"] = "healthy"
    except Exception:
        status["database"] = "unhealthy"
        status["status"] = "degraded"
        http_status = 503

    # Check Cache / Redis connectivity (soft check)
    try:
        cache.set("_health_ping", "pong", 5)
        if cache.get("_health_ping") == "pong":
            status["cache"] = "healthy"
        else:
            status["cache"] = "unresponsive"
    except Exception:
        status["cache"] = "unavailable"

    return JsonResponse(status, status=http_status)
