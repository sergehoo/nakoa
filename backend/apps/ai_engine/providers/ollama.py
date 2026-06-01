"""Provider Ollama — modèles locaux pour données sensibles ou mode dégradé."""

from __future__ import annotations

from typing import Iterable

import requests
from django.conf import settings

from .base import AIProvider, ChatMessage, ChatResponse


class OllamaProvider(AIProvider):
    code = "ollama"
    default_model = "llama3.1:8b"

    def __init__(self, config=None):
        super().__init__(config or {})
        self.base_url = self.config.get("base_url") or settings.OLLAMA_BASE_URL
        self.default_model = self.config.get("model") or settings.OLLAMA_MODEL or "llama3.1:8b"

    def chat(self, messages: Iterable[ChatMessage], *, model=None, temperature=0.3,
             max_tokens=1024, tools=None, response_format=None) -> ChatResponse:
        payload = {
            "model": model or self.default_model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "options": {"temperature": temperature, "num_predict": max_tokens},
            "stream": False,
        }
        r = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=60)
        r.raise_for_status()
        data = r.json()
        msg = data.get("message", {})
        return ChatResponse(
            content=msg.get("content", ""),
            model=data.get("model", payload["model"]),
            tokens_in=data.get("prompt_eval_count", 0),
            tokens_out=data.get("eval_count", 0),
            raw=data,
            finish_reason=data.get("done_reason", ""),
        )
