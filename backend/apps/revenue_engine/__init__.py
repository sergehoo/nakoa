"""Revenue Engine — moteur de monétisation administrable.

Centralise toutes les sources de revenus de la marketplace Nakoa. Aucune règle
financière n'est codée en dur : tout est défini en base via des modèles
configurables depuis le BO Super Admin.

Modules :
- models       : RevenueSource, MonetizationConfig, CommissionRule, RuleVersion,
                 RuleAuditLog, RuleEvaluationLog, RevenueEntry.
- services     : rule_engine (DSL JSON), commission_calculator.
- viewsets     : API DRF Super Admin.
"""

default_app_config = "apps.revenue_engine.apps.RevenueEngineConfig"
