import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/atelier/screens/atelier_dashboard_screen.dart';
import '../features/atelier/screens/qr_scan_screen.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/otp_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/auth/screens/splash_screen.dart';
import '../features/auth/screens/two_factor_screen.dart';
import '../features/catalog/screens/catalog_screen.dart';
import '../features/catalog/screens/product_detail_screen.dart';
import '../features/dashboard/screens/customer_dashboard_screen.dart';
import '../features/delivery/screens/courier_dashboard_screen.dart';
import '../features/delivery/screens/delivery_screen.dart';
import '../features/delivery/screens/proof_screen.dart';
import '../features/notifications/screens/notifications_screen.dart';
import '../features/orders/screens/order_detail_screen.dart';
import '../features/orders/screens/orders_screen.dart';
import '../features/quotes/screens/quote_detail_screen.dart';
import '../features/quotes/screens/quotes_screen.dart';
import '../features/settings/screens/settings_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: ref.watch(authProvider.notifier),
    redirect: (context, state) {
      final loggedIn = auth.value?.isAuthenticated ?? false;
      final loading = auth.isLoading;
      final isAuthPage = ['/login', '/register', '/otp', '/two-factor', '/splash']
          .any((p) => state.matchedLocation.startsWith(p));
      if (loading) return null;
      if (!loggedIn && !isAuthPage) return '/login';
      if (loggedIn && isAuthPage && state.matchedLocation != '/splash') return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),

      // Auth
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(
        path: '/otp',
        builder: (ctx, state) => OtpScreen(
          identifier: state.uri.queryParameters['identifier'] ?? '',
          purpose: state.uri.queryParameters['purpose'] ?? 'email_verify',
        ),
      ),
      GoRoute(path: '/two-factor', builder: (_, __) => const TwoFactorScreen()),

      // Home (selon rôle)
      GoRoute(
        path: '/home',
        redirect: (context, _) {
          final role = auth.value?.user?.primaryRole;
          if (role == 'courier') return '/courier';
          if (role == 'printer' || role == 'printer_agent' || role == 'quality_controller') {
            return '/atelier';
          }
          return '/dashboard';
        },
      ),

      // Espace client
      GoRoute(path: '/dashboard', builder: (_, __) => const CustomerDashboardScreen()),
      GoRoute(path: '/catalog', builder: (_, __) => const CatalogScreen()),
      GoRoute(
        path: '/catalog/:slug',
        builder: (ctx, state) => ProductDetailScreen(slug: state.pathParameters['slug']!),
      ),
      GoRoute(path: '/quotes', builder: (_, __) => const QuotesScreen()),
      GoRoute(
        path: '/quotes/:id',
        builder: (ctx, state) => QuoteDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(path: '/orders', builder: (_, __) => const OrdersScreen()),
      GoRoute(
        path: '/orders/:id',
        builder: (ctx, state) => OrderDetailScreen(id: state.pathParameters['id']!),
      ),

      // Livreur
      GoRoute(path: '/courier', builder: (_, __) => const CourierDashboardScreen()),
      GoRoute(
        path: '/delivery/:id',
        builder: (ctx, state) => DeliveryScreen(assignmentId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/delivery/:id/proof',
        builder: (ctx, state) => ProofScreen(assignmentId: state.pathParameters['id']!),
      ),

      // Atelier (imprimeur)
      GoRoute(path: '/atelier', builder: (_, __) => const AtelierDashboardScreen()),
      GoRoute(path: '/atelier/scan', builder: (_, __) => const QrScanScreen()),

      // Transverses
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
    ],
    errorBuilder: (ctx, state) => Scaffold(
      body: Center(child: Text('Route inconnue : ${state.uri}')),
    ),
  );
});
