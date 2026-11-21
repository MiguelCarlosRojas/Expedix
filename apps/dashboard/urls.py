from django.urls import path
from .views import (
    DashboardStatsView, DashboardChartsView, DashboardIntegrationsStatusView,
    DashboardRecentActivityView
)

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('charts/', DashboardChartsView.as_view(), name='dashboard-charts'),
    path('integrations/', DashboardIntegrationsStatusView.as_view(), name='dashboard-integrations'),
    path('activity/', DashboardRecentActivityView.as_view(), name='dashboard-activity'),
]
