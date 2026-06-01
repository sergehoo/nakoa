"""Wrapper de tous les appels chat IA avec audit + latence."""

from __future__ import annotations

import time
from typing import Iterable

from django.utils import timezone

from ..models import AICallLog, PromptTemplate
from ..providers import ChatMessage, get_ai_provider


def chat_with_audit(
    *,
    messages: Iterable[ChatMessage],
    feature: str,
    user=None,
    backend: str | None = None,
    template: PromptTemplate | None = None,
    **kwargs,
):
    provider = get_ai_provider(backend)
    started = time.time()
    try:
        response = provider.chat(messages, **kwargs)
        latency = int((time.time() - started) * 1000)
        AICallLog.objects.create(
            provider=provider.code,
            model=response.model,
            user=user,
            feature=feature,
            prompt_template=template,
            request_payload={"messages": [{"role": m.role, "content": m.content[:1000]} for m in messages]},
            response_payload={"content": response.content[:2000], "finish": response.finish_reason},
            tokens_in=response.tokens_in,
            tokens_out=response.tokens_out,
            latency_ms=latency,
            success=True,
        )
        return response
    except Exception as exc:  # noqa: BLE001
        latency = int((time.time() - started) * 1000)
        AICallLog.objects.create(
            provider=provider.code,
            model=provider.default_model,
            user=user,
            feature=feature,
            prompt_template=template,
            success=False,
            error=str(exc)[:2000],
            latency_ms=latency,
        )
        raise
