"""Tests de charge Locust — objectif 10 000 RPM sans dégradation > 5 %.

Usage :
    docker run -p 8089:8089 -v $(pwd)/locust:/mnt/locust \
        locustio/locust -f /mnt/locust/locustfile.py --host=https://staging-api.printhub.io
"""

from __future__ import annotations

import random

from locust import HttpUser, between, task


class PrintHubAnonymousUser(HttpUser):
    wait_time = between(1, 3)

    @task(5)
    def browse_catalog(self):
        self.client.get("/api/v1/catalog/products/")

    @task(3)
    def list_categories(self):
        self.client.get("/api/v1/catalog/categories/")

    @task(2)
    def search_products(self):
        terms = ["flyer", "carte", "bâche", "brochure", "affiche"]
        self.client.get(f"/api/v1/catalog/products/?search={random.choice(terms)}")

    @task(1)
    def view_printer_directory(self):
        self.client.get("/api/v1/printers/directory/")


class PrintHubAuthenticatedUser(HttpUser):
    wait_time = between(2, 5)
    access_token: str | None = None

    def on_start(self):
        r = self.client.post("/api/v1/auth/login/", json={
            "email": "aissata@demo.printhub.io",
            "password": "Printhub2026!",
        })
        if r.status_code == 200:
            self.access_token = r.json()["access"]
            self.client.headers["Authorization"] = f"Bearer {self.access_token}"

    @task(3)
    def view_dashboard(self):
        self.client.get("/api/v1/dashboards/customer/")

    @task(2)
    def list_my_orders(self):
        self.client.get("/api/v1/orders/")

    @task(1)
    def check_notifications(self):
        self.client.get("/api/v1/notifications/unread-count/")
