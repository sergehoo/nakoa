"""URL principales de PrintHub."""

from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


api_v1_patterns = [
    # ========== Authentification ==========
    path("auth/", include("apps.authentication.urls")),

    # ========== Comptes / Profils ==========
    path("accounts/", include("apps.accounts.urls")),
    path("organizations/", include("apps.organizations.urls")),

    # ========== Acteurs marketplace ==========
    path("printers/", include("apps.printers.urls")),
    path("customers/", include("apps.customers.urls")),

    # ========== Catalogue & devis ==========
    path("catalog/", include("apps.catalog.urls")),
    path("pricing/", include("apps.pricing.urls")),
    path("quote-requests/", include("apps.quote_requests.urls")),
    path("matching/", include("apps.matching.urls")),

    # ========== Cycle commande ==========
    path("orders/", include("apps.orders.urls")),
    path("production/", include("apps.production.urls")),
    path("logistics/", include("apps.logistics.urls")),
    path("delivery/", include("apps.delivery.urls")),

    # ========== Argent ==========
    path("payments/", include("apps.payments.urls")),
    path("subscriptions/", include("apps.subscriptions.urls")),
    path("billing/", include("apps.billing.urls")),

    # ========== Relation client ==========
    path("reviews/", include("apps.reviews.urls")),
    path("notifications/", include("apps.notifications.urls")),
    path("chat/", include("apps.chat.urls")),
    path("support/", include("apps.support.urls")),
    path("crm/", include("apps.crm.urls")),

    # ========== IA ==========
    path("ai/", include("apps.ai_engine.urls")),
    path("assistant/", include("apps.ai_assistant.urls")),

    # ========== Transversales ==========
    path("audit/", include("apps.audit.urls")),
    path("kyc/", include("apps.kyc.urls")),
    path("analytics/", include("apps.analytics.urls")),
    path("dashboards/", include("apps.dashboards.urls")),
    path("workflows/", include("apps.workflows.urls")),
    path("documents/", include("apps.documents.urls")),
    path("storage/", include("apps.storage.urls")),
]


urlpatterns = [
    path("admin/", admin.site.urls),

    # Metrics Prometheus
    path("", include("django_prometheus.urls")),

    # API v1
    path("api/v1/", include((api_v1_patterns, "v1"))),

    # OpenAPI / Swagger / Redoc
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # AllAuth (OAuth Google etc.)
    path("accounts/", include("allauth.urls")),
]

if settings.DEBUG:
    from django.conf.urls.static import static
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    try:
        import debug_toolbar
        urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]
    except ImportError:
        pass
