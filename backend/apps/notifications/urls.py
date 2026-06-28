from django.urls import path
from rest_framework.routers import DefaultRouter

from .views_push import public_key, subscribe, test_push, unsubscribe
from .viewsets import NotificationViewSet

router = DefaultRouter()
router.register("", NotificationViewSet, basename="notification")

urlpatterns = [
    # Web Push (PWA)
    path("push/public-key/", public_key, name="push-public-key"),
    path("push/subscribe/", subscribe, name="push-subscribe"),
    path("push/unsubscribe/", unsubscribe, name="push-unsubscribe"),
    path("push/test/", test_push, name="push-test"),

    *router.urls,
]
