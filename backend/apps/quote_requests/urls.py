from django.urls import path
from rest_framework.routers import DefaultRouter

from .viewsets import OpportunityViewSet, QuoteRequestViewSet

router = DefaultRouter()
router.register("", QuoteRequestViewSet, basename="quote-request")

# Routes opportunités (montées sous /opportunities/ pour les imprimeurs)
opportunity_list = OpportunityViewSet.as_view({"get": "list"})
opportunity_respond = OpportunityViewSet.as_view({"post": "respond"})
opportunity_decline = OpportunityViewSet.as_view({"post": "decline"})

urlpatterns = [
    path("opportunities/", opportunity_list, name="opportunities"),
    path("opportunities/<uuid:pk>/respond/", opportunity_respond, name="opportunity-respond"),
    path("opportunities/<uuid:pk>/decline/", opportunity_decline, name="opportunity-decline"),
    *router.urls,
]
