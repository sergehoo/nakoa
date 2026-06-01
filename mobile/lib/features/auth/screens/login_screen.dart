import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _twoFactor = TextEditingController();
  bool _needs2FA = false;
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _twoFactor.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(authProvider.notifier).login(
            email: _email.text.trim(),
            password: _password.text,
            twoFactorCode: _twoFactor.text.isEmpty ? null : _twoFactor.text,
          );
      if (mounted) context.go('/home');
    } on AppException catch (e) {
      if (e.message.toLowerCase().contains('2fa')) {
        setState(() => _needs2FA = true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),
                Text('Bon retour', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Text('Connectez-vous pour gérer vos commandes',
                    style: theme.textTheme.bodyMedium?.copyWith(color: theme.hintColor)),
                const SizedBox(height: 32),
                AppTextField(
                  label: 'Email',
                  controller: _email,
                  prefixIcon: Icons.mail_outline,
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.email],
                  validator: (v) => (v == null || !v.contains('@')) ? 'Email invalide' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Mot de passe',
                  controller: _password,
                  obscureText: _obscure,
                  prefixIcon: Icons.lock_outline,
                  autofillHints: const [AutofillHints.password],
                  suffix: IconButton(
                    icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                  validator: (v) => (v == null || v.length < 8) ? '8 caractères minimum' : null,
                ),
                if (_needs2FA) ...[
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Code 2FA',
                    controller: _twoFactor,
                    keyboardType: TextInputType.number,
                    prefixIcon: Icons.shield_outlined,
                    hint: '123 456',
                  ),
                ],
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push('/otp?purpose=password_reset'),
                    child: const Text('Mot de passe oublié ?'),
                  ),
                ),
                const SizedBox(height: 8),
                AppButton(label: 'Se connecter', onPressed: _submit, loading: _loading),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Pas de compte ? '),
                    TextButton(
                      onPressed: () => context.push('/register'),
                      child: const Text('Créer un compte'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
