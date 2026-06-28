"""Promotion & Coupon Engine — codes promo et campagnes configurables.

Tout est administrable depuis le BO Super Admin (sans déploiement) :
- campagnes avec dates de validité, conditions DSL, type de discount
- codes individuels (générés ou personnalisés), quotas global/per_user
- historique d'utilisation (CouponRedemption)
"""

default_app_config = "apps.promotions.apps.PromotionsConfig"
