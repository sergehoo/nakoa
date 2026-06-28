"""Tests unitaires du moteur de règles DSL JSON."""

from __future__ import annotations

from decimal import Decimal

import pytest

from apps.revenue_engine.services.rule_engine import (
    RuleEngineError,
    evaluate_rule,
)


CONTEXT = {
    "order": {
        "total": Decimal("750000"),
        "currency": "XOF",
        "status": "completed",
    },
    "printer": {
        "is_premium": True,
        "country": "CI",
    },
    "customer": {
        "primary_role": "customer",
    },
    "items": [{"sku": "ABC", "qty": 3}, {"sku": "XYZ", "qty": 1}],
}


class TestPathResolution:
    def test_simple_path(self):
        assert evaluate_rule({"fact": "order.currency", "op": "eq", "value": "XOF"}, CONTEXT)

    def test_nested_path(self):
        assert evaluate_rule({"fact": "printer.is_premium", "op": "eq", "value": True}, CONTEXT)

    def test_indexed_path(self):
        assert evaluate_rule({"fact": "items[0].sku", "op": "eq", "value": "ABC"}, CONTEXT)

    def test_missing_path_returns_none(self):
        # missing key + op exists → False
        assert not evaluate_rule({"fact": "ghost.field", "op": "exists", "value": None}, CONTEXT)


class TestOperators:
    def test_eq_ne(self):
        assert evaluate_rule({"fact": "order.status", "op": "eq", "value": "completed"}, CONTEXT)
        assert evaluate_rule({"fact": "order.status", "op": "ne", "value": "draft"}, CONTEXT)

    def test_numeric_comparisons(self):
        assert evaluate_rule({"fact": "order.total", "op": "gt", "value": 500000}, CONTEXT)
        assert evaluate_rule({"fact": "order.total", "op": "gte", "value": 750000}, CONTEXT)
        assert evaluate_rule({"fact": "order.total", "op": "lt", "value": 1000000}, CONTEXT)
        assert not evaluate_rule({"fact": "order.total", "op": "gt", "value": 1000000}, CONTEXT)

    def test_in_not_in(self):
        assert evaluate_rule({"fact": "printer.country", "op": "in", "value": ["CI", "SN"]}, CONTEXT)
        assert evaluate_rule({"fact": "printer.country", "op": "not_in", "value": ["BJ"]}, CONTEXT)

    def test_between(self):
        assert evaluate_rule({"fact": "order.total", "op": "between", "value": [500000, 1000000]}, CONTEXT)
        assert not evaluate_rule({"fact": "order.total", "op": "between", "value": [0, 100000]}, CONTEXT)


class TestCombinators:
    def test_all(self):
        rule = {"all": [
            {"fact": "order.total", "op": "gt", "value": 500000},
            {"fact": "printer.is_premium", "op": "eq", "value": True},
        ]}
        assert evaluate_rule(rule, CONTEXT)

    def test_all_fails_if_any_false(self):
        rule = {"all": [
            {"fact": "order.total", "op": "gt", "value": 500000},
            {"fact": "printer.is_premium", "op": "eq", "value": False},
        ]}
        assert not evaluate_rule(rule, CONTEXT)

    def test_any(self):
        rule = {"any": [
            {"fact": "order.total", "op": "lt", "value": 100},  # False
            {"fact": "order.currency", "op": "eq", "value": "XOF"},  # True
        ]}
        assert evaluate_rule(rule, CONTEXT)

    def test_not(self):
        rule = {"not": {"fact": "order.status", "op": "eq", "value": "draft"}}
        assert evaluate_rule(rule, CONTEXT)


class TestEdgeCases:
    def test_empty_rule_matches(self):
        assert evaluate_rule({}, CONTEXT)
        assert evaluate_rule(None, CONTEXT)
        assert evaluate_rule(True, CONTEXT)
        assert not evaluate_rule(False, CONTEXT)

    def test_unknown_operator_raises(self):
        with pytest.raises(RuleEngineError):
            evaluate_rule({"fact": "order.total", "op": "wat", "value": 0}, CONTEXT)

    def test_malformed_rule_raises(self):
        with pytest.raises(RuleEngineError):
            evaluate_rule({"random": "stuff"}, CONTEXT)
