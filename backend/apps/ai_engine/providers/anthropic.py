"""Provider Anthropic Claude."""

from __future__ import annotations

from typing import Iterable

from django.conf import settings

from .base import AIProvider, ChatMessage, ChatResponse


class AnthropicProvider(AIProvider):
    code = "anthropic"
    default_model = "claude-sonnet-4-5"

    def __init__(self, config=None):
        super().__init__(config or {})
        import anthropic
        self.client = anthropic.Anthropic(api_key=self.config.get("api_key") or settings.ANTHROPIC_API_KEY)
        self.default_model = self.config.get("model") or settings.ANTHROPIC_MODEL

    def chat(self, messages: Iterable[ChatMessage], *, model=None, temperature=0.3,
             max_tokens=1024, tools=None, response_format=None) -> ChatResponse:
        msgs = list(messages)
        system = next((m.content for m in msgs if m.role == "system"), "")
        user_messages = [{"role": m.role, "content": m.content} for m in msgs if m.role != "system"]
        resp = self.client.messages.create(
            model=model or self.default_model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=user_messages,
        )
        text = "\n".join(block.text for block in resp.content if hasattr(block, "text"))
        usage = resp.usage
        return ChatResponse(
            content=text,
            model=resp.model,
            tokens_in=usage.input_tokens if usage else 0,
            tokens_out=usage.output_tokens if usage else 0,
            raw=resp.model_dump(),
            finish_reason=resp.stop_reason,
        )
