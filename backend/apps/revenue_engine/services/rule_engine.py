"""Moteur de règles DSL JSON pour le Revenue Engine.

DSL minimal, suffisant pour 95% des cas métier sans donner l'exécution de code
arbitraire au Super Admin.

# Format

Un noeud est l'un de :
- combinateur : {"all": [n, …]}, {"any": [n, …]}, {"not": n}
- comparateur : {"fact": "<chemin>", "op": "<op>", "value": <litéral>}
- littéral    : true / false

# Chemins (`fact`)

Notation pointée dans un contexte dict-like, exemple :
- "order.total"           → context["order"]["total"]
- "order.printer.country" → context["order"]["printer"]["country"]

Les listes/tuples peuvent être indexés via [i] :
- "items[0].sku"

# Opérateurs

- eq, ne, gt, gte, lt, lte
- in, not_in (value = liste)
- contains   (value est dans le fact, fact peut être string ou liste)
- exists     (true si le chemin existe et n'est pas None)
- between    (value = [min, max], inclusif)

# Exemple

```json
{
  "all": [
    {"fact": "order.total", "op": "gt", "value": 500000},
    {"any": [
      {"fact": "printer.is_premium", "op": "eq", "value": true},
      {"fact": "order.currency", "op": "eq", "value": "XOF"}
    ]},
    {"not": {"fact": "customer.is_blacklisted", "op": "eq", "value": true}}
  ]
}
```
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any


class RuleEngineError(ValueError):
    """Erreur d'évaluation : règle mal formée ou opérateur inconnu."""


# ------------------------------------------------------------
# Résolution de chemins
# ------------------------------------------------------------
def _resolve_path(context: Any, path: str) -> Any:
    """Résout un chemin pointé du type ``a.b[0].c`` dans context.

    Retourne ``None`` si une étape échoue plutôt que de lever, pour
    que les comparateurs puissent utiliser ``exists`` proprement.
    """
    if not path:
        return context

    current = context
    # Split sur '.' puis on traite chaque token pour récupérer les [i].
    for token in path.split("."):
        if current is None:
            return None
        # Gère token = "items[0][1]"
        name, indices = _extract_indices(token)
        if name:
            if isinstance(current, dict):
                current = current.get(name)
            else:
                current = getattr(current, name, None)
        for idx in indices:
            if current is None:
                return None
            try:
                current = current[idx]
            except (IndexError, KeyError, TypeError):
                return None
    return current


def _extract_indices(token: str) -> tuple[str, list[int]]:
    """``items[0][2]`` → ("items", [0, 2])."""
    if "[" not in token:
        return token, []
    name, _, rest = token.partition("[")
    indices: list[int] = []
    while rest:
        end = rest.find("]")
        if end == -1:
            raise RuleEngineError(f"Crochet non fermé dans : {token!r}")
        idx_str = rest[:end]
        try:
            indices.append(int(idx_str))
        except ValueError as exc:
            raise RuleEngineError(f"Index non entier dans : {token!r}") from exc
        rest = rest[end + 1:]
        if rest.startswith("["):
            rest = rest[1:]
    return name, indices


# ------------------------------------------------------------
# Comparateurs
# ------------------------------------------------------------
def _coerce(a: Any, b: Any) -> tuple[Any, Any]:
    """Aligne les types pour comparer Decimal/int/float entre eux."""
    if isinstance(a, Decimal) or isinstance(b, Decimal):
        try:
            return Decimal(str(a)), Decimal(str(b))
        except Exception:  # noqa: BLE001
            return a, b
    return a, b


def _op_eq(a, b) -> bool:
    a, b = _coerce(a, b)
    return a == b


def _op_gt(a, b) -> bool:
    a, b = _coerce(a, b)
    try:
        return a > b
    except TypeError:
        return False


def _op_lt(a, b) -> bool:
    a, b = _coerce(a, b)
    try:
        return a < b
    except TypeError:
        return False


_COMPARATORS = {
    "eq": _op_eq,
    "ne": lambda a, b: not _op_eq(a, b),
    "gt": _op_gt,
    "gte": lambda a, b: _op_gt(a, b) or _op_eq(a, b),
    "lt": _op_lt,
    "lte": lambda a, b: _op_lt(a, b) or _op_eq(a, b),
    "in": lambda a, b: a in (b or []),
    "not_in": lambda a, b: a not in (b or []),
    "contains": lambda a, b: (b in a) if a is not None else False,
    "exists": lambda a, b: a is not None,
    "between": lambda a, b: (
        isinstance(b, (list, tuple)) and len(b) == 2
        and (_op_gt(a, b[0]) or _op_eq(a, b[0]))
        and (_op_lt(a, b[1]) or _op_eq(a, b[1]))
    ),
}


# ------------------------------------------------------------
# Évaluation
# ------------------------------------------------------------
def evaluate_rule(rule: Any, context: dict) -> bool:
    """Évalue le DSL ``rule`` contre ``context``.

    Args:
        rule: structure JSON conforme au DSL ci-dessus.
        context: dict imbriqué (avec clés ``order``, ``printer``, ``customer``…).

    Returns:
        ``True`` si la règle matche.

    Raises:
        RuleEngineError: règle mal formée.
    """
    # Cas dégénérés
    if rule is None or rule == {}:
        return True  # règle vide = matche toujours
    if rule is True:
        return True
    if rule is False:
        return False

    if not isinstance(rule, dict):
        raise RuleEngineError(f"Noeud de règle invalide : {rule!r}")

    # Combinateurs
    if "all" in rule:
        children = rule.get("all") or []
        return all(evaluate_rule(child, context) for child in children)
    if "any" in rule:
        children = rule.get("any") or []
        return any(evaluate_rule(child, context) for child in children)
    if "not" in rule:
        return not evaluate_rule(rule["not"], context)

    # Comparateur
    if "fact" in rule and "op" in rule:
        op = rule["op"]
        comparator = _COMPARATORS.get(op)
        if not comparator:
            raise RuleEngineError(f"Opérateur inconnu : {op!r}")
        fact_value = _resolve_path(context, rule["fact"])
        expected = rule.get("value")
        return bool(comparator(fact_value, expected))

    raise RuleEngineError(f"Noeud de règle non reconnu : {rule!r}")
