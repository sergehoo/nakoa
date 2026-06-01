import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pinput/pinput.dart';

import '../../../core/errors.dart';
import '../../../data/api/auth_api.dart';
import '../../../shared/widgets/app_button.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.identifier, required this.purpose});
  final String identifier;
  final String purpose;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _controller = TextEditingController();
  bool _loading = false;
  int _resendCountdown = 0;

  @override
  void initState() {
    super.initState();
    _startCooldown();
  }

  void _startCooldown() {
    setState(() => _resendCountdown = 30);
    Future.doWhile(() async {
      await Future<void>.delayed(const Duration(seconds: 1));
      if (!mounted || _resendCountdown == 0) return false;
      setState(() => _resendCountdown -= 1);
      return _resendCountdown > 0;
    });
  }

  Future<void> _verify() async {
    setState(() => _loading = true);
    try {
      await ref.read(authApiProvider).verifyOtp(
            identifier: widget.identifier,
            code: _controller.text,
            purpose: widget.purpose,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vérifié')));
        context.go('/login');
      }
    } on AppException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    try {
      await ref.read(authApiProvider).requestOtp(
            identifier: widget.identifier,
            purpose: widget.purpose,
            channel: widget.purpose.contains('email') ? 'email' : 'sms',
          );
      _startCooldown();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nouveau code envoyé')));
      }
    } on AppException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final defaultPin = PinTheme(
      width: 52,
      height: 56,
      textStyle: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.dividerColor),
        color: theme.cardColor,
      ),
    );
    return Scaffold(
      appBar: AppBar(leading: const BackButton()),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 12),
              Container(
                width: 64,
                height: 64,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.mark_email_unread_outlined, color: theme.colorScheme.primary, size: 28),
              ),
              const SizedBox(height: 16),
              Text('Vérification',
                  style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              Text('Entrez le code reçu sur ${widget.identifier}',
                  style: theme.textTheme.bodyMedium?.copyWith(color: theme.hintColor)),
              const SizedBox(height: 32),
              Center(
                child: Pinput(
                  length: 6,
                  controller: _controller,
                  defaultPinTheme: defaultPin,
                  focusedPinTheme: defaultPin.copyWith(
                    decoration: defaultPin.decoration!.copyWith(
                      border: Border.all(color: theme.colorScheme.primary, width: 1.5),
                    ),
                  ),
                  onCompleted: (_) => _verify(),
                ),
              ),
              const SizedBox(height: 32),
              AppButton(label: 'Vérifier', onPressed: _verify, loading: _loading),
              const SizedBox(height: 12),
              TextButton(
                onPressed: _resendCountdown == 0 ? _resend : null,
                child: Text(_resendCountdown == 0 ? 'Renvoyer le code' : 'Renvoyer dans $_resendCountdown s'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
