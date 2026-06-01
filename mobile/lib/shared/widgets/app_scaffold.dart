import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppBottomNav extends StatelessWidget {
  const AppBottomNav({super.key, required this.currentIndex, this.role = 'customer'});
  final int currentIndex;
  final String role;

  static const _customerItems = [
    (Icons.home_outlined, Icons.home, 'Accueil', '/dashboard'),
    (Icons.grid_view_outlined, Icons.grid_view, 'Catalogue', '/catalog'),
    (Icons.receipt_long_outlined, Icons.receipt_long, 'Commandes', '/orders'),
    (Icons.person_outline, Icons.person, 'Compte', '/settings'),
  ];
  static const _courierItems = [
    (Icons.dashboard_outlined, Icons.dashboard, 'Tournée', '/courier'),
    (Icons.notifications_outlined, Icons.notifications, 'Alertes', '/notifications'),
    (Icons.person_outline, Icons.person, 'Compte', '/settings'),
  ];
  static const _atelierItems = [
    (Icons.dashboard_outlined, Icons.dashboard, 'Atelier', '/atelier'),
    (Icons.qr_code_scanner_outlined, Icons.qr_code_scanner, 'Scanner', '/atelier/scan'),
    (Icons.notifications_outlined, Icons.notifications, 'Alertes', '/notifications'),
    (Icons.person_outline, Icons.person, 'Compte', '/settings'),
  ];

  @override
  Widget build(BuildContext context) {
    final items = role == 'courier'
        ? _courierItems
        : role == 'printer'
            ? _atelierItems
            : _customerItems;
    return BottomNavigationBar(
      currentIndex: currentIndex.clamp(0, items.length - 1),
      onTap: (i) => context.go(items[i].$4),
      items: [
        for (final i in items)
          BottomNavigationBarItem(icon: Icon(i.$1), activeIcon: Icon(i.$2), label: i.$3),
      ],
    );
  }
}
