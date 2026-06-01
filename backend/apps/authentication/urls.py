from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    LoginView,
    LogoutView,
    OTPViewSet,
    PasswordResetViewSet,
    RefreshView,
    RegisterView,
    TwoFactorViewSet,
)

router = DefaultRouter()
router.register("otp", OTPViewSet, basename="otp")
router.register("password-reset", PasswordResetViewSet, basename="password-reset")
router.register("2fa", TwoFactorViewSet, basename="2fa")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", RefreshView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    *router.urls,
]
