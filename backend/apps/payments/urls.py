from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    PaymentViewSet,
    WalletViewSet,
    cinetpay_webhook,
    stripe_webhook,
    wave_webhook,
)

router = DefaultRouter()
router.register("", PaymentViewSet, basename="payment")
router.register("wallet", WalletViewSet, basename="wallet")

urlpatterns = [
    path("webhooks/stripe/", stripe_webhook, name="webhook-stripe"),
    path("webhooks/cinetpay/", cinetpay_webhook, name="webhook-cinetpay"),
    path("webhooks/wave/", wave_webhook, name="webhook-wave"),
    *router.urls,
]
