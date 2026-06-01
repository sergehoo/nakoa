"""Provider OpenAI."""

from __future__ import annotations

from typing import Iterable

from django.conf import settings

from .base import AIProvider, ChatMessage, ChatResponse


class OpenAIProvider(AIProvider):
    code = "openai"
    default_model = "gpt-4o-mini"

    def __init__(self, config=None):
        super().__init__(config or {})
        from openai import OpenAI
        self.client = OpenAI(api_key=self.config.get("api_key") or settings.OPENAI_API_KEY)
        self.default_model = self.config.get("model") or settings.OPENAI_MODEL or "gpt-4o-mini"

    def chat(self, messages: Iterable[ChatMessage], *, model=None, temperature=0.3,
             max_tokens=1024, tools=None, response_format=None) -> ChatResponse:
        payload = {
            "model": model or self.default_model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if tools:
            payload["tools"] = tools
        if response_format:
            payload["response_format"] = response_format
        resp = self.client.chat.completions.create(**payload)
        choice = resp.choices[0]
        tool_calls = []
        if choice.message.tool_calls:
            tool_calls = [
                {"id": tc.id, "name": tc.function.name, "arguments": tc.function.arguments}
                for tc in choice.message.tool_calls
            ]
        return ChatResponse(
            content=choice.message.content or "",
            model=resp.model,
            tokens_in=resp.usage.prompt_tokens if resp.usage else 0,
            tokens_out=resp.usage.completion_tokens if resp.usage else 0,
            tool_calls=tool_calls,
            raw=resp.model_dump(),
            finish_reason=choice.finish_reason,
        )

    def embed(self, texts):
        resp = self.client.embeddings.create(model="text-embedding-3-small", input=texts)
        return [d.embedding for d in resp.data]
