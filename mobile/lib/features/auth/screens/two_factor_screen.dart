import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors.dart';
import '../../../data/api/auth_api.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';

class TwoFactorScreen extends ConsumerStatefulWidget {
  const TwoFactorScreen({super.key});

  @override
  ConsumerState<TwoFactorScreen> createState() => _TwoFactorScreenState();
}

class _TwoFactorScreenState extends ConsumerState<TwoFactorScreen> {
  String? _secret;
  String? _uri;
  List<String> _backupCodes = [];
  final _code = TextEditingController();
  bool _busy = false;

  Future<void> _setup() async {
    setState(() => _busy = true);
    try {
      final r = await ref.read(authApiProvider).setupTotp();
      setState(() {
        _secret = r.secret;
        _uri = r.provisioningUri;
        _backupCodes = r.backupCodes;
      });
    } on AppException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      setState(() => _busy = false);
    }
  }

  Future<void> _confirm() async {
    setState(() => _busy = true);
    try {
      await ref.read(authApiProvider).confirmTotp(_code.text);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('2FA activé')));
        Navigator.of(context).pop();
      }
    } on AppException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Activer la 2FA')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Renforcez la sécurité de votre compte',
                  style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(
                'Scannez le secret dans Google Authenticator, Authy ou 1Password, puis confirmez avec un code à 6 chiffres.',
                style: theme.textTheme.bodyMedium?.copyWith(color: theme.hintColor),
              ),
              const SizedBox(height: 24),
              if (_secret == null) ...[
                AppButton(label: 'Générer un secret', onPressed: _setup, loading: _busy),
              ] else ...[
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Secret', style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Expanded(child: SelectableText(_secret!, style: const TextStyle(fontFamily: 'monospace'))),
                            IconButton(
                              icon: const Icon(Icons.copy_outlined, size: 18),
                              onPressed: () => Clipboard.setData(ClipboardData(text: _secret!)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Codes de secours', style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 6),
                        const Text('Conservez ces codes hors-ligne, chacun à usage unique.', style: TextStyle(fontSize: 12)),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 12,
                          runSpacing: 6,
                          children: _backupCodes
                              .map((c) => Text(c, style: const TextStyle(fontFamily: 'monospace', fontSize: 14)))
                              .toList(),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Code à 6 chiffres',
                  controller: _code,
                  keyboardType: TextInputType.number,
                  prefixIcon: Icons.shield_outlined,
                ),
                const SizedBox(height: 16),
                AppButton(label: 'Confirmer', onPressed: _confirm, loading: _busy),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
