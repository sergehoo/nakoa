import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:signature/signature.dart';

import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';

class ProofScreen extends ConsumerStatefulWidget {
  const ProofScreen({super.key, required this.assignmentId});
  final String assignmentId;

  @override
  ConsumerState<ProofScreen> createState() => _ProofScreenState();
}

class _ProofScreenState extends ConsumerState<ProofScreen> {
  final _sigController = SignatureController(penStrokeWidth: 2, penColor: Colors.black);
  final _receiverName = TextEditingController();
  final _picker = ImagePicker();
  String? _photoPath;
  Uint8List? _sigBytes;
  bool _busy = false;

  @override
  void dispose() {
    _sigController.dispose();
    _receiverName.dispose();
    super.dispose();
  }

  Future<void> _takePhoto() async {
    final f = await _picker.pickImage(source: ImageSource.camera, imageQuality: 85);
    if (f != null) setState(() => _photoPath = f.path);
  }

  Future<void> _submit() async {
    final sig = await _sigController.toPngBytes();
    setState(() {
      _busy = true;
      _sigBytes = sig;
    });
    // TODO: upload photo + signature via PresignedUpload puis create DeliveryProof
    await Future<void>.delayed(const Duration(seconds: 1));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Livraison confirmée')));
      context.go('/courier');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Preuve de livraison')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AppTextField(
                label: 'Nom du réceptionnaire',
                controller: _receiverName,
                prefixIcon: Icons.person_outline,
              ),
              const SizedBox(height: 20),
              const Text('Photo de la livraison', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              AspectRatio(
                aspectRatio: 4 / 3,
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: _takePhoto,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      border: Border.all(color: Theme.of(context).dividerColor),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: _photoPath == null
                        ? const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.add_a_photo_outlined, size: 36),
                                SizedBox(height: 8),
                                Text('Prendre une photo'),
                              ],
                            ),
                          )
                        : Image.asset(_photoPath!, fit: BoxFit.cover),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text('Signature du client', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Container(
                height: 160,
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  border: Border.all(color: Theme.of(context).dividerColor),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Signature(controller: _sigController, backgroundColor: Colors.transparent),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () => _sigController.clear(),
                  icon: const Icon(Icons.refresh, size: 16),
                  label: const Text('Effacer'),
                ),
              ),
              const SizedBox(height: 16),
              AppButton(label: 'Confirmer la livraison', onPressed: _submit, loading: _busy),
            ],
          ),
        ),
      ),
    );
  }
}
