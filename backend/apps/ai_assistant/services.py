"""Assistants conversationnels par rôle avec outils dédiés (function calling)."""

from __future__ import annotations

from apps.ai_engine.providers import ChatMessage
from apps.ai_engine.services import chat_with_audit

from .models import AssistantConversation, AssistantMessage, AssistantPersona


SYSTEM_PROMPTS = {
    AssistantPersona.CUSTOMER: (
        "Tu es l'assistant client Nakoa, plateforme d'impression Nakoa en Afrique de l'Ouest. "
        "Tu aides les clients à : (1) trouver le bon produit et créer un devis, (2) suivre leurs commandes, "
        "(3) comprendre les options d'impression (papier, finition, quantité), (4) ouvrir un litige. "
        "Tu réponds en français, ton clair et chaleureux. Toujours proposer une action concrète. "
        "Tu ne divulgues jamais de données d'autres utilisateurs."
    ),
    AssistantPersona.PRINTER: (
        "Tu es l'assistant imprimeur Nakoa. Tu aides les imprimeurs partenaires Nakoa à : (1) prioriser "
        "leur production du jour, (2) optimiser leurs prix selon la concurrence, (3) anticiper les retards, "
        "(4) communiquer avec leurs clients. Tu donnes des recommandations actionnables, jamais d'analyse vague."
    ),
    AssistantPersona.ADMIN: (
        "Tu es l'assistant admin Nakoa. Tu aides l'équipe interne Nakoa à explorer les données opérationnelles. "
        "Tu n'inventes jamais de chiffres : si tu ne sais pas, tu utilises un outil ou tu indiques que tu ignores. "
        "Tu refuses toute requête qui exposerait des données personnelles sans agrégation."
    ),
}


def reply_in_conversation(
    *, conversation: AssistantConversation, user_text: str, user,
) -> AssistantMessage:
    AssistantMessage.objects.create(conversation=conversation, role="user", content=user_text)

    persona = AssistantPersona(conversation.persona)
    history = list(conversation.messages.order_by("created_at"))
    messages = [ChatMessage(role="system", content=SYSTEM_PROMPTS[persona])]
    for m in history:
        messages.append(ChatMessage(role=m.role, content=m.content))

    response = chat_with_audit(
        messages=messages,
        feature=f"assistant.{persona}",
        user=user,
        temperature=0.4,
        max_tokens=800,
    )

    return AssistantMessage.objects.create(
        conversation=conversation,
        role="assistant",
        content=response.content,
        tokens=response.tokens_in + response.tokens_out,
    )
