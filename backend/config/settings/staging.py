"""Settings staging — proche prod mais relâché pour tests."""

from .production import *  # noqa: F401,F403

DEBUG = False
SENTRY_ENVIRONMENT = "staging"
SECURE_HSTS_SECONDS = 0  # désactivé en staging pour faciliter les tests
