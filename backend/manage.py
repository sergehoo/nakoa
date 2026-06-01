#!/usr/bin/env python
"""Point d'entrée Django pour PrintHub."""

import os
import sys


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Django ne peut pas être importé. Vérifiez votre environnement virtuel."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
