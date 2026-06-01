"""Sélecteur de provider IA selon settings.AI_BACKEND."""

from __future__ import annotations

from django.conf import settings

from .anthropic import AnthropicProvider
from .base import AIProvider
from .ollama import OllamaProvider
from .openai import OpenAIProvider


_PROVIDERS = {
    "openai": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "local": OllamaProvider,
    "ollama": OllamaProvider,
}


def get_ai_provider(backend: str | None = None) -> AIProvider:
    backend = backend or settings.AI_BACKEND
    # Mode auto : si OPENAI_API_KEY présent → openai sinon ollama
    if backend == "auto":
        backend = "openai" if settings.OPENAI_API_KEY else "ollama"
    klass = _PROVIDERS.get(backend)
    if not klass:
        raise ValueError(f"AI backend inconnu : {backend}")
    return klass()
