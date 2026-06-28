"""
Settings de base PrintHub — communs à tous les environnements.

Charge les variables d'environnement via django-environ et expose les sous-réglages
nécessaires aux apps (paiement, IA, stockage, etc.).
"""

from __future__ import annotations

from datetime import timedelta
from pathlib import Path

import environ

# ============================================================
# Paths & env
# ============================================================
BASE_DIR = Path(__file__).resolve().parent.parent.parent
APPS_DIR = BASE_DIR / "apps"

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    DJANGO_ALLOWED_HOSTS=(list, []),
    DJANGO_CSRF_TRUSTED_ORIGINS=(list, []),
)

# Charge .env si présent (dev local). En production, les variables sont injectées.
env_file = BASE_DIR / ".env"
if env_file.exists():
    env.read_env(str(env_file))

SECRET_KEY = env("DJANGO_SECRET_KEY", default="insecure-dev-secret-change-me")
DEBUG = env("DJANGO_DEBUG")
ALLOWED_HOSTS = env("DJANGO_ALLOWED_HOSTS")
CSRF_TRUSTED_ORIGINS = env("DJANGO_CSRF_TRUSTED_ORIGINS")

# ============================================================
# Applications
# ============================================================
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "django.contrib.gis",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "django_extensions",
    "guardian",
    "django_fsm",
    "phonenumber_field",
    "django_countries",
    "django_celery_beat",
    "django_celery_results",
    "channels",
    "storages",
    "drf_spectacular",
    "drf_spectacular_sidecar",
    "django_prometheus",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
]

LOCAL_APPS = [
    "apps.core",
    "apps.accounts",
    "apps.authentication",
    "apps.organizations",
    "apps.printers",
    "apps.customers",
    "apps.catalog",
    "apps.pricing",
    "apps.quote_requests",
    "apps.matching",
    "apps.orders",
    "apps.production",
    "apps.logistics",
    "apps.delivery",
    "apps.payments",
    "apps.subscriptions",
    "apps.reviews",
    "apps.notifications",
    "apps.chat",
    "apps.analytics",
    "apps.ai_engine",
    "apps.ai_assistant",
    "apps.audit",
    "apps.kyc",
    "apps.support",
    "apps.billing",
    "apps.crm",
    "apps.workflows",
    "apps.dashboards",
    "apps.documents",
    "apps.storage",
    "apps.revenue_engine",
    "apps.promotions",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ============================================================
# Middleware
# ============================================================
MIDDLEWARE = [
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.core.middleware.RequestIDMiddleware",
    "apps.audit.middleware.AuditTrailMiddleware",
    "django_prometheus.middleware.PrometheusAfterMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ============================================================
# Templates
# ============================================================
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ============================================================
# Database
# ============================================================
DATABASES = {
    "default": env.db_url(
        "DATABASE_URL",
        default="postgres://printhub:printhub@localhost:5432/printhub",
        engine="django.contrib.gis.db.backends.postgis",
    ),
}
DATABASES["default"]["CONN_MAX_AGE"] = 60
DATABASES["default"]["ATOMIC_REQUESTS"] = False

# ============================================================
# Auth
# ============================================================
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "guardian.backends.ObjectPermissionBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

# ============================================================
# django-allauth — configuration email-only (notre User n'a pas de username)
# ============================================================
ACCOUNT_USER_MODEL_USERNAME_FIELD = None  # désactive toute référence au champ username
ACCOUNT_USER_MODEL_EMAIL_FIELD = "email"
ACCOUNT_EMAIL_VERIFICATION = "optional"   # on gère la vérif via notre propre OTP
ACCOUNT_UNIQUE_EMAIL = True

# allauth >= 65.x — nouveaux noms (les anciens ACCOUNT_AUTHENTICATION_METHOD /
# ACCOUNT_EMAIL_REQUIRED / ACCOUNT_USERNAME_REQUIRED sont dépréciés.)
ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
]

LOGIN_URL = "/admin/login/"
LOGIN_REDIRECT_URL = "/admin/"
LOGOUT_REDIRECT_URL = "/"

# ============================================================
# I18n / L10n
# ============================================================
LANGUAGE_CODE = "fr"
TIME_ZONE = "Africa/Abidjan"
USE_I18N = True
USE_TZ = True

LANGUAGES = [
    ("fr", "Français"),
    ("en", "English"),
]
LOCALE_PATHS = [BASE_DIR / "locale"]

# ============================================================
# Static / Media
# ============================================================
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"] if (BASE_DIR / "static").exists() else []
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ============================================================
# Storage (MinIO / S3)
# ============================================================
AWS_S3_ENDPOINT_URL = env("AWS_S3_ENDPOINT_URL", default="")
AWS_S3_ACCESS_KEY_ID = env("AWS_S3_ACCESS_KEY_ID", default="")
AWS_S3_SECRET_ACCESS_KEY = env("AWS_S3_SECRET_ACCESS_KEY", default="")
AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME", default="printhub-media")
AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", default="us-east-1")
AWS_S3_USE_SSL = env.bool("AWS_S3_USE_SSL", default=False)
AWS_S3_ADDRESSING_STYLE = "path"
AWS_S3_SIGNATURE_VERSION = "s3v4"
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None
AWS_QUERYSTRING_AUTH = True

# ============================================================
# Cache / Channels / Sessions
# ============================================================
REDIS_URL = env("REDIS_URL", default="redis://localhost:6379/0")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    },
}

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [env("CHANNEL_LAYERS_URL", default=REDIS_URL)]},
    },
}

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# ============================================================
# DRF
# ============================================================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "user": "120/min",
        "anon": "30/min",
        "auth": "5/min",
        "ai": "30/min",
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "EXCEPTION_HANDLER": "apps.core.exceptions.printhub_exception_handler",
}

# ============================================================
# JWT
# ============================================================
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env.int("JWT_ACCESS_TTL_MINUTES", default=15)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env.int("JWT_REFRESH_TTL_DAYS", default=30)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": env("JWT_SIGNING_ALGORITHM", default="HS256"),
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_OBTAIN_SERIALIZER": "apps.authentication.serializers.PrintHubTokenObtainPairSerializer",
}

# ============================================================
# Spectacular (OpenAPI)
# ============================================================
SPECTACULAR_SETTINGS = {
    "TITLE": "PrintHub API",
    "DESCRIPTION": (
        "API REST de la plateforme PrintHub — marketplace, ERP de production, "
        "CRM et moteur IA pour l'industrie de l'impression."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": r"/api/v1",
    "COMPONENT_SPLIT_REQUEST": True,
    "SWAGGER_UI_DIST": "SIDECAR",
    "SWAGGER_UI_FAVICON_HREF": "SIDECAR",
    "REDOC_DIST": "SIDECAR",
    "CONTACT": {"name": "Équipe PrintHub", "email": "tech@printhub.io"},
    "TAGS": [
        {"name": "auth", "description": "Authentification, OTP, 2FA"},
        {"name": "catalog", "description": "Catalogue produits"},
        {"name": "quotes", "description": "Demandes de devis"},
        {"name": "orders", "description": "Commandes"},
        {"name": "production", "description": "ERP production"},
        {"name": "payments", "description": "Paiements et escrow"},
        {"name": "printers", "description": "Imprimeurs"},
        {"name": "ai", "description": "Assistants et fonctions IA"},
    ],
}

# ============================================================
# Celery
# ============================================================
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default=REDIS_URL)
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="django-db")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

CELERY_TASK_ROUTES = {
    "apps.ai_engine.tasks.*": {"queue": "ai"},
    "apps.documents.tasks.*": {"queue": "heavy"},
    "apps.notifications.tasks.*": {"queue": "notifications"},
}

# ============================================================
# Email
# ============================================================
# En dev/test : console par défaut (logs terminal) — utile pour debug local
# En prod    : injecter EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)
EMAIL_TIMEOUT = env.int("EMAIL_TIMEOUT", default=15)

DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="Nakoa <no-reply@nakoahub.com>")
SERVER_EMAIL = env("SERVER_EMAIL", default=DEFAULT_FROM_EMAIL)
EMAIL_SUBJECT_PREFIX = env("EMAIL_SUBJECT_PREFIX", default="[Nakoa] ")

# ============================================================
# Web Push (PWA — VAPID)
# ============================================================
# Génération des clés (à exécuter une fois en local) :
#   python manage.py generate_vapid_keys
# Puis copier les valeurs dans .env.prod
VAPID_PUBLIC_KEY = env("VAPID_PUBLIC_KEY", default="")
VAPID_PRIVATE_KEY = env("VAPID_PRIVATE_KEY", default="")
VAPID_CLAIM_EMAIL = env("VAPID_CLAIM_EMAIL", default="mailto:tech@nakoahub.com")
WEB_PUSH_TTL = env.int("WEB_PUSH_TTL", default=60 * 60 * 24)  # 24h

# ============================================================
# AI providers
# ============================================================
AI_BACKEND = env("AI_BACKEND", default="auto")
AI_RATE_LIMIT_RPM = env.int("AI_RATE_LIMIT_RPM", default=60)
OPENAI_API_KEY = env("OPENAI_API_KEY", default="")
OPENAI_MODEL = env("OPENAI_MODEL", default="gpt-4o-mini")
ANTHROPIC_API_KEY = env("ANTHROPIC_API_KEY", default="")
ANTHROPIC_MODEL = env("ANTHROPIC_MODEL", default="claude-sonnet-4-5")
OLLAMA_BASE_URL = env("OLLAMA_BASE_URL", default="http://ollama:11434")
OLLAMA_MODEL = env("OLLAMA_MODEL", default="llama3.1:8b")

# ============================================================
# Paiements
# ============================================================
PLATFORM_DEFAULT_CURRENCY = env("PLATFORM_DEFAULT_CURRENCY", default="XOF")
PLATFORM_COMMISSION_PERCENT = env.int("PLATFORM_COMMISSION_PERCENT", default=10)

PAYMENT_PROVIDERS = {
    "stripe": {
        "public_key": env("STRIPE_PUBLIC_KEY", default=""),
        "secret_key": env("STRIPE_SECRET_KEY", default=""),
        "webhook_secret": env("STRIPE_WEBHOOK_SECRET", default=""),
    },
    "cinetpay": {
        "api_key": env("CINETPAY_API_KEY", default=""),
        "site_id": env("CINETPAY_SITE_ID", default=""),
        "secret": env("CINETPAY_SECRET", default=""),
        "notify_url": env("CINETPAY_NOTIFY_URL", default=""),
        "return_url": env("CINETPAY_RETURN_URL", default=""),
    },
    "paystack": {
        "secret_key": env("PAYSTACK_SECRET_KEY", default=""),
        "public_key": env("PAYSTACK_PUBLIC_KEY", default=""),
    },
    "flutterwave": {
        "secret_key": env("FLUTTERWAVE_SECRET_KEY", default=""),
        "public_key": env("FLUTTERWAVE_PUBLIC_KEY", default=""),
        "hash": env("FLUTTERWAVE_HASH", default=""),
    },
    "wave": {
        "api_key": env("WAVE_API_KEY", default=""),
        "business_id": env("WAVE_BUSINESS_ID", default=""),
    },
    "orange_money": {
        "client_id": env("ORANGE_MONEY_CLIENT_ID", default=""),
        "client_secret": env("ORANGE_MONEY_CLIENT_SECRET", default=""),
        "merchant_key": env("ORANGE_MONEY_MERCHANT_KEY", default=""),
    },
    "mtn_momo": {
        "api_user": env("MTN_MOMO_API_USER", default=""),
        "api_key": env("MTN_MOMO_API_KEY", default=""),
        "subscription_key": env("MTN_MOMO_SUBSCRIPTION_KEY", default=""),
    },
}

# ============================================================
# Notifications
# ============================================================
SMS_BACKEND = env("SMS_BACKEND", default="apps.notifications.backends.ConsoleSMSBackend")
AFRICASTALKING_USERNAME = env("AFRICASTALKING_USERNAME", default="sandbox")
AFRICASTALKING_API_KEY = env("AFRICASTALKING_API_KEY", default="")
AFRICASTALKING_SENDER_ID = env("AFRICASTALKING_SENDER_ID", default="PrintHub")

WHATSAPP_PHONE_NUMBER_ID = env("WHATSAPP_PHONE_NUMBER_ID", default="")
WHATSAPP_ACCESS_TOKEN = env("WHATSAPP_ACCESS_TOKEN", default="")

FCM_SERVER_KEY = env("FCM_SERVER_KEY", default="")
FCM_PROJECT_ID = env("FCM_PROJECT_ID", default="")

# ============================================================
# Search
# ============================================================
ELASTICSEARCH_DSL = {
    "default": {"hosts": env("ELASTICSEARCH_URL", default="http://elasticsearch:9200")},
}

# ============================================================
# CORS / Sécurité de base
# ============================================================
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:3000", "http://localhost:5173"],
)
CORS_ALLOW_CREDENTIALS = True

# ============================================================
# Plateforme
# ============================================================
PLATFORM_NAME = env("PLATFORM_NAME", default="PrintHub")
PLATFORM_URL = env("PLATFORM_URL", default="https://app.printhub.io")
SUPPORT_EMAIL = env("SUPPORT_EMAIL", default="support@printhub.io")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ============================================================
# Sentry (overridé en prod)
# ============================================================
SENTRY_DSN = env("SENTRY_DSN", default="")
SENTRY_ENVIRONMENT = env("SENTRY_ENVIRONMENT", default="dev")
SENTRY_TRACES_SAMPLE_RATE = env.float("SENTRY_TRACES_SAMPLE_RATE", default=0.1)
