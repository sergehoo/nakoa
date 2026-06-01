import 'package:flutter/material.dart';

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.icon,
    this.variant = AppButtonVariant.primary,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;
  final AppButtonVariant variant;

  @override
  Widget build(BuildContext context) {
    final child = loading
        ? const SizedBox(
            height: 20,
            width: 20,
            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
          )
        : Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
              Text(label),
            ],
          );

    final handler = loading ? null : onPressed;
    switch (variant) {
      case AppButtonVariant.primary:
        return ElevatedButton(onPressed: handler, child: child);
      case AppButtonVariant.outlined:
        return OutlinedButton(onPressed: handler, child: child);
      case AppButtonVariant.text:
        return TextButton(onPressed: handler, child: child);
    }
  }
}

enum AppButtonVariant { primary, outlined, text }
