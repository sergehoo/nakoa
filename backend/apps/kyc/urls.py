from rest_framework.routers import DefaultRouter
from .viewsets import KYCDocumentViewSet, KYCSubmissionViewSet

router = DefaultRouter()
router.register("submissions", KYCSubmissionViewSet, basename="kyc-submission")
router.register("documents", KYCDocumentViewSet, basename="kyc-document")
urlpatterns = router.urls
