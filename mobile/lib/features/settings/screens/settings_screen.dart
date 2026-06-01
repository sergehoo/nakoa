import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../auth/providers/auth_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).value?.user;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Mon compte')),
      body: ListView(
        children: [
          if (user != null) ...[
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: theme.colorScheme.primary.withOpacity(0.1),
                    child: Text(
                      user.fullName.split(' ').take(2).map((p) => p.isEmpty ? '' : p[0]).join().toUpperCase(),
                      style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user.fullName,
                            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                        Text(user.email,
                            style: theme.textTheme.bodySmall?.copyWith(color: theme.hintColor)),
                        const SizedBox(height: 4),
                        Wrap(
                          spacing: 6,
                          children: [
                            _Pill('KYC ${user.kycLevel}'),
                            if (user.twoFactorEnabled) const _Pill('2FA actif'),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
          ],
          _SettingTile(
            icon: Icons.shield_outlined,
            title: 'Sécurité',
            subtitle: user?.twoFactorEnabled ?? false ? '2FA activé' : 'Activer la 2FA',
            onTap: () => context.push('/two-factor'),
          ),
          _SettingTile(
            icon: Icons.language,
            title: 'Langue',
            subtitle: 'Français',
            onTap: () {},
          ),
          _SettingTile(
            icon: Icons.dark_mode_outlined,
            title: 'Apparence',
            subtitle: 'Suit le système',
            onTap: () {},
          ),
          _SettingTile(
            icon: Icons.help_outline,
            title: 'Centre d\'aide',
            onTap: () {},
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Déconnexion', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600)),
            onTap: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
          ),
          const _VersionFooter(),
        ],
      ),
    );
  }
}

class _SettingTile extends StatelessWidget {
  const _SettingTile({required this.icon, required this.title, this.subtitle, this.onTap});
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => ListTile(
        leading: Icon(icon),
        title: Text(title),
        subtitle: subtitle != null ? Text(subtitle!) : null,
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      );
}

class _Pill extends StatelessWidget {
  const _Pill(this.label);
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}

class _VersionFooter extends StatelessWidget {
  const _VersionFooter();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<PackageInfo>(
      future: PackageInfo.fromPlatform(),
      builder: (_, snap) => Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Text(
            snap.hasData ? 'PrintHub v${snap.data!.version} • build ${snap.data!.buildNumber}' : 'PrintHub',
            style: TextStyle(fontSize: 11, color: Theme.of(context).hintColor),
          ),
        ),
      ),
    );
  }
}
