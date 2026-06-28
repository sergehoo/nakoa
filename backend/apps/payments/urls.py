from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    PaymentViewSet,
    WalletViewSet,
    cinetpay_webhook,
    paystack_webhook,
    stripe_webhook,
    verify_payment,
    wave_webhook,
)

router = DefaultRouter()
router.register("", PaymentViewSet, basename="payment")
router.register("wallet", WalletViewSet, basename="wallet")

urlpatterns = [
    # Webhooks signés (publics)
    path("webhooks/stripe/", stripe_webhook, name="webhook-stripe"),
    path("webhooks/cinetpay/", cinetpay_webhook, name="webhook-cinetpay"),
    path("webhooks/wave/", wave_webhook, name="webhook-wave"),
    path("webhooks/paystack/", paystack_webhook, name="webhook-paystack"),
    # Vérification active (authentifié)
    path("verify/", verify_payment, name="payment-verify"),
    *router.urls,
]
