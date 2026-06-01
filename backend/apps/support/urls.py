from rest_framework.routers import DefaultRouter
from .viewsets import TicketViewSet

router = DefaultRouter()
router.register("tickets", TicketViewSet, basename="ticket")
urlpatterns = router.urls
