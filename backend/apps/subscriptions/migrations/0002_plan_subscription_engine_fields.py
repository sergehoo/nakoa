"""Extension Plan pour le Subscription Engine — Phase 3.

Migration en 3 étapes pour gérer la contrainte unique sur `code` :
1. Ajoute les nouveaux champs (code sans unique pour l'instant)
2. RunPython : remplit `code` pour chaque Plan existant
3. AlterField : ajoute la contrainte unique
"""

from django.db import migrations, models
from django.utils.text import slugify


def _fill_codes(apps, schema_editor):
    Plan = apps.get_model("subscriptions", "Plan")
    seen: set[str] = set()
    for plan in Plan.objects.all():
        base = slugify(f"{plan.tier}-{plan.name}")[:60] or f"plan-{plan.pk}"
        code = base
        i = 1
        while code in seen:
            i += 1
            code = f"{base}-{i}"[:64]
        plan.code = code
        seen.add(code)
        plan.save(update_fields=["code"])


def _noop_reverse(apps, schema_editor):
    """Réversible (les codes restent mais ne sont plus uniques)."""
    return None


class Migration(migrations.Migration):

    dependencies = [
        ("subscriptions", "0001_initial"),
    ]

    operations = [
        # 1) Ajoute les nouveaux champs additifs
        migrations.AddField(
            model_name="plan",
            name="code",
            field=models.SlugField(blank=True, db_index=True, default="", max_length=64),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="plan",
            name="is_public",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="plan",
            name="is_highlight",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="plan",
            name="sort_order",
            field=models.PositiveIntegerField(db_index=True, default=100),
        ),
        migrations.AddField(
            model_name="plan",
            name="trial_days",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="plan",
            name="tagline",
            field=models.CharField(blank=True, default="", max_length=200),
        ),
        migrations.AddField(
            model_name="plan",
            name="cta_label",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
        migrations.AddField(
            model_name="plan",
            name="target_role",
            field=models.CharField(
                choices=[
                    ("any", "Tout le monde"),
                    ("customer", "Particuliers"),
                    ("customer_corporate", "Entreprises"),
                    ("printer", "Imprimeurs"),
                    ("courier", "Livreurs"),
                ],
                db_index=True, default="any", max_length=24,
            ),
        ),
        migrations.AddField(
            model_name="plan",
            name="quotas",
            field=models.JSONField(blank=True, default=dict),
        ),

        # 2) Remplit le champ code sur l'existant
        migrations.RunPython(_fill_codes, _noop_reverse),

        # 3) Ajoute la contrainte unique sur code
        migrations.AlterField(
            model_name="plan",
            name="code",
            field=models.SlugField(blank=True, db_index=True, max_length=64, unique=True),
        ),

        # 4) Re-trie via Meta.ordering
        migrations.AlterModelOptions(
            name="plan",
            options={"ordering": ("sort_order", "monthly_price")},
        ),
    ]
