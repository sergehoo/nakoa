from rest_framework.routers import DefaultRouter
from .viewsets import PresignedUploadViewSet

router = DefaultRouter()
router.register("presigned", PresignedUploadViewSet, basename="presigned-upload")
urlpatterns = router.urls
