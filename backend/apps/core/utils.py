"""Utilitaires transversaux."""

from __future__ import annotations

import secrets
import string
from datetime import datetime
from decimal import Decimal
from typing import Any


def generate_reference(prefix: str = "PH", year: int | None = None, length: int = 8) -> str:
    """Génère une référence humaine type PH-2026-A4F8B2C1."""
    year = year or datetime.utcnow().year
    alphabet = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(alphabet) for _ in range(length))
    return f"{prefix}-{year}-{suffix}"


def generate_otp(length: int = 6) -> str:
    """Génère un code OTP numérique."""
    return "".join(secrets.choice(string.digits) for _ in range(length))


def safe_decimal(value: Any, default: str = "0") -> Decimal:
    try:
        return Decimal(str(value))
    except Exception:  # noqa: BLE001
        return Decimal(default)


def percent(amount: Decimal | float | int, percentage: Decimal | float | int) -> Decimal:
    return (safe_decimal(amount) * safe_decimal(percentage) / Decimal("100")).quantize(Decimal("0.01"))
