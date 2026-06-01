import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QrScanScreen extends StatefulWidget {
  const QrScanScreen({super.key});

  @override
  State<QrScanScreen> createState() => _QrScanScreenState();
}

class _QrScanScreenState extends State<QrScanScreen> {
  final _controller = MobileScannerController();
  bool _scanned = false;
  String? _lastCode;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handle(String code) {
    setState(() {
      _scanned = true;
      _lastCode = code;
    });
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.qr_code_2, size: 48),
            const SizedBox(height: 12),
            const Text('Job scanné', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
            const SizedBox(height: 8),
            Text(code, textAlign: TextAlign.center, style: const TextStyle(fontFamily: 'monospace')),
            const SizedBox(height: 20),
            FilledButton.icon(
              icon: const Icon(Icons.play_arrow_rounded),
              label: const Text('Démarrer l\'étape'),
              onPressed: () => Navigator.pop(context),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              icon: const Icon(Icons.check),
              label: const Text('Terminer l\'étape'),
              onPressed: () => Navigator.pop(context),
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              icon: const Icon(Icons.report_problem_outlined),
              label: const Text('Signaler un incident'),
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    ).then((_) => setState(() => _scanned = false));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scanner un QR'), backgroundColor: Colors.black, foregroundColor: Colors.white),
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: (capture) {
              if (_scanned) return;
              final code = capture.barcodes.firstOrNull?.rawValue;
              if (code != null && code != _lastCode) _handle(code);
            },
          ),
          Center(
            child: Container(
              width: 240,
              height: 240,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white, width: 2),
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
          Positioned(
            bottom: 32,
            left: 24,
            right: 24,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(12)),
              child: const Text(
                'Pointez la caméra sur le QR code du job',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
