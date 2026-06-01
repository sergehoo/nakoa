import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _phone = TextEditingController();
  String _country = 'CI';
  String _role = 'customer';
  bool _loading = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(authProvider.notifier).register(
            email: _email.text.trim(),
            password: _password.text,
            firstName: _firstName.text.trim(),
            lastName: _lastName.text.trim(),
            phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
            country: _country,
            role: _role,
          );
      if (mounted) {
        context.go('/otp?identifier=${Uri.encodeComponent(_email.text)}&purpose=email_verify');
      }
    } on AppException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(elevation: 0, leading: const BackButton()),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Créer un compte',
                    style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(child: _RoleCard(label: 'Client', icon: Icons.shopping_bag_outlined, selected: _role == 'customer', onTap: () => setState(() => _role = 'customer'))),
                    const SizedBox(width: 12),
                    Expanded(child: _RoleCard(label: 'Imprimeur', icon: Icons.print_outlined, selected: _role == 'printer', onTap: () => setState(() => _role = 'printer'))),
                    const SizedBox(width: 12),
                    Expanded(child: _RoleCard(label: 'Livreur', icon: Icons.motorcycle_outlined, selected: _role == 'courier', onTap: () => setState(() => _role = 'courier'))),
                  ],
                ),
                const SizedBox(height: 20),
                Row(children: [
                  Expanded(child: AppTextField(label: 'Prénom', controller: _firstName, validator: (v) => v == null || v.length < 2 ? 'Requis' : null)),
                  const SizedBox(width: 12),
                  Expanded(child: AppTextField(label: 'Nom', controller: _lastName, validator: (v) => v == null || v.length < 2 ? 'Requis' : null)),
                ]),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Email',
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icons.mail_outline,
                  validator: (v) => v == null || !v.contains('@') ? 'Email invalide' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Téléphone (optionnel)',
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  prefixIcon: Icons.phone_outlined,
                  hint: '+225 07 XX XX XX XX',
                ),
                const SizedBox(height: 16),
                _CountrySelector(value: _country, onChanged: (v) => setState(() => _country = v)),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Mot de passe',
                  controller: _password,
                  obscureText: true,
                  prefixIcon: Icons.lock_outline,
                  validator: (v) => v == null || v.length < 10 ? '10 caractères minimum' : null,
                ),
                const SizedBox(height: 24),
                AppButton(label: 'Créer mon compte', onPressed: _submit, loading: _loading),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({required this.label, required this.icon, required this.selected, required this.onTap});
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: selected ? theme.colorScheme.primary.withOpacity(0.08) : theme.cardColor,
          border: Border.all(color: selected ? theme.colorScheme.primary : theme.dividerColor),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(icon, color: selected ? theme.colorScheme.primary : theme.hintColor),
            const SizedBox(height: 6),
            Text(label, style: TextStyle(fontWeight: selected ? FontWeight.w700 : FontWeight.w500, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

class _CountrySelector extends StatelessWidget {
  const _CountrySelector({required this.value, required this.onChanged});
  final String value;
  final ValueChanged<String> onChanged;

  static const _options = [
    ('CI', 'Côte d\'Ivoire'),
    ('SN', 'Sénégal'),
    ('BJ', 'Bénin'),
    ('TG', 'Togo'),
    ('BF', 'Burkina Faso'),
    ('ML', 'Mali'),
    ('CM', 'Cameroun'),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Pays', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: value,
          decoration: const InputDecoration(prefixIcon: Icon(Icons.public, size: 20)),
          items: _options
              .map((c) => DropdownMenuItem(value: c.$1, child: Text(c.$2)))
              .toList(),
          onChanged: (v) {
            if (v != null) onChanged(v);
          },
        ),
      ],
    );
  }
}
