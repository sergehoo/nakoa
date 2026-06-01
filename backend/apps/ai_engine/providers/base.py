"""Interface AIProvider — tous les providers concrets l'implémentent."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Iterable


@dataclass
class ChatMessage:
    role: str  # "system" | "user" | "assistant" | "tool"
    content: str
    name: str = ""


@dataclass
class ChatResponse:
    content: str
    model: str
    tokens_in: int = 0
    tokens_out: int = 0
    tool_calls: list[dict] = field(default_factory=list)
    raw: dict[str, Any] = field(default_factory=dict)
    finish_reason: str = ""


class AIProvider(ABC):
    code: str = "base"
    default_model: str = ""

    def __init__(self, config: dict[str, Any] | None = None):
        self.config = config or {}

    @abstractmethod
    def chat(
        self,
        messages: Iterable[ChatMessage],
        *,
        model: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
        tools: list[dict] | None = None,
        response_format: dict | None = None,
    ) -> ChatResponse:
        ...

    def embed(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError
