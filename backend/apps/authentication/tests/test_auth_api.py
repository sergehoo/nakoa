"""Tests de l'API d'authentification."""

import pytest
from rest_framework import status


@pytest.mark.django_db
class TestAuthAPI:
    def test_register_creates_user(self, api_client):
        r = api_client.post("/api/v1/auth/register/", {
            "email": "newuser@example.com",
            "password": "Pwd!12345678",
            "first_name": "Jean",
            "last_name": "Kouassi",
            "country": "CI",
        }, format="json")
        assert r.status_code == status.HTTP_201_CREATED, r.data

    def test_login_returns_tokens(self, api_client):
        from apps.accounts.factories import CustomerFactory
        user = CustomerFactory(email="login@example.com")
        user.set_password("Pwd!12345678")
        user.save()
        r = api_client.post("/api/v1/auth/login/", {
            "email": "login@example.com",
            "password": "Pwd!12345678",
        }, format="json")
        assert r.status_code == status.HTTP_200_OK, r.data
        assert "access" in r.data
        assert "refresh" in r.data
        assert r.data["user"]["email"] == "login@example.com"

    def test_login_wrong_password(self, api_client):
        from apps.accounts.factories import CustomerFactory
        user = CustomerFactory(email="login2@example.com")
        user.set_password("Pwd!12345678")
        user.save()
        r = api_client.post("/api/v1/auth/login/", {
            "email": "login2@example.com",
            "password": "WrongPwd",
        }, format="json")
        assert r.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_requires_auth(self, api_client):
        r = api_client.get("/api/v1/accounts/me/")
        assert r.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
