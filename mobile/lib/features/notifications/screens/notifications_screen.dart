import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/api/notifications_api.dart';
import '../../../data/models/notification.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/empty_state.dart';

final _notificationsProvider =
    FutureProvider<List<AppNotification>>((ref) => ref.read(notificationsApiProvider).list());

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(_notificationsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(notificationsApiProvider).readAll();
              ref.invalidate(_notificationsProvider);
            },
            child: const Text('Tout marquer lu'),
          ),
        ],
      ),
      body: notifications.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (list) => list.isEmpty
            ? const EmptyState(icon: Icons.notifications_off_outlined, title: 'Pas de notification')
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(_notificationsProvider),
                child: ListView.separated(
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final n = list[i];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: n.isRead
                            ? Colors.transparent
                            : Theme.of(context).colorScheme.primary.withOpacity(0.1),
                        child: Icon(
                          _channelIcon(n.channel),
                          color: n.isRead ? Colors.grey : Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      title: Text(n.subject,
                          style: TextStyle(
                            fontWeight: n.isRead ? FontWeight.w500 : FontWeight.w700,
                          )),
                      subtitle: Text(n.body, maxLines: 2, overflow: TextOverflow.ellipsis),
                      trailing: Text(relative(n.createdAt), style: const TextStyle(fontSize: 11)),
                      onTap: () async {
                        await ref.read(notificationsApiProvider).markRead(n.id);
                        ref.invalidate(_notificationsProvider);
                      },
                    );
                  },
                ),
              ),
      ),
    );
  }

  IconData _channelIcon(String channel) {
    return switch (channel) {
      'email' => Icons.mail_outline,
      'sms' => Icons.sms_outlined,
      'push' => Icons.notifications_active_outlined,
      'whatsapp' => Icons.chat_outlined,
      _ => Icons.info_outline,
    };
  }
}
