from rest_framework.routers import DefaultRouter
from .viewsets import OrganizationMemberViewSet, OrganizationViewSet

router = DefaultRouter()
router.register("", OrganizationViewSet, basename="organization")
router.register("members", OrganizationMemberViewSet, basename="org-member")
urlpatterns = router.urls
