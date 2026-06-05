from django.urls import path
from rest_framework.routers import DefaultRouter

from .members_viewset import PrinterMemberViewSet
from .views_marketplace import by_badge, printer_marketplace_rank, top_ranking
from .views_score import my_printer_score, printer_score_public
from .viewsets import (
    CapabilityViewSet,
    DeliveryZoneViewSet,
    FinishViewSet,
    MachineViewSet,
    PrinterAgentViewSet,
    PrinterDirectoryViewSet,
    PrinterProfileViewSet,
)

router = DefaultRouter()
router.register("directory", PrinterDirectoryViewSet, basename="printer-directory")
router.register("profile", PrinterProfileViewSet, basename="printer-profile")
router.register("machines", MachineViewSet, basename="machine")
router.register("finishes", FinishViewSet, basename="finish")
router.register("delivery-zones", DeliveryZoneViewSet, basename="delivery-zone")
router.register("capabilities", CapabilityViewSet, basename="capability")
router.register("agents", PrinterAgentViewSet, basename="agent")
router.register("members", PrinterMemberViewSet, basename="member")

urlpatterns = [
    # PrintHub Score
    path("public/<slug:slug>/score/", printer_score_public, name="printer-score-public"),
    path("me/score/", my_printer_score, name="printer-score-me"),

    # Marketplace Intelligence
    path("ranking/top/", top_ranking, name="marketplace-top"),
    path("ranking/badge/<str:badge>/", by_badge, name="marketplace-badge"),
    path("public/<slug:slug>/rank/", printer_marketplace_rank, name="marketplace-rank"),

    *router.urls,
]
