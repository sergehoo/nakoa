import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../../data/api/delivery_api.dart';
import '../../../shared/widgets/app_button.dart';

class DeliveryScreen extends ConsumerStatefulWidget {
  const DeliveryScreen({super.key, required this.assignmentId});
  final String assignmentId;

  @override
  ConsumerState<DeliveryScreen> createState() => _DeliveryScreenState();
}

class _DeliveryScreenState extends ConsumerState<DeliveryScreen> {
  StreamSubscription<Position>? _positionSub;
  LatLng? _current;
  String _status = 'Initialisation GPS…';

  @override
  void initState() {
    super.initState();
    _startTracking();
  }

  @override
  void dispose() {
    _positionSub?.cancel();
    super.dispose();
  }

  Future<void> _startTracking() async {
    final hasService = await Geolocator.isLocationServiceEnabled();
    if (!hasService) {
      setState(() => _status = 'GPS désactivé');
      return;
    }
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
    if (perm == LocationPermission.deniedForever || perm == LocationPermission.denied) {
      setState(() => _status = 'Permission refusée');
      return;
    }
    setState(() => _status = 'GPS actif');
    _positionSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: 20),
    ).listen((pos) {
      setState(() => _current = LatLng(pos.latitude, pos.longitude));
      ref.read(deliveryApiProvider).reportLocation(
            assignmentId: widget.assignmentId,
            lat: pos.latitude,
            lng: pos.longitude,
            speedKmh: pos.speed * 3.6,
            accuracy: pos.accuracy,
          );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Course en cours')),
      body: Stack(
        children: [
          FlutterMap(
            options: MapOptions(
              initialCenter: _current ?? const LatLng(5.345, -4.024),
              initialZoom: 13,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'io.printhub.mobile',
              ),
              if (_current != null)
                MarkerLayer(markers: [
                  Marker(
                    point: _current!,
                    width: 36,
                    height: 36,
                    child: const Icon(Icons.location_pin, color: Colors.red, size: 36),
                  ),
                ]),
            ],
          ),
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Card(
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Icon(Icons.gps_fixed, color: Theme.of(context).colorScheme.primary, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_status, style: const TextStyle(fontWeight: FontWeight.w600))),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 16,
            left: 16,
            right: 16,
            child: AppButton(
              label: 'Marquer comme livrée',
              icon: Icons.check_rounded,
              onPressed: () => context.push('/delivery/${widget.assignmentId}/proof'),
            ),
          ),
        ],
      ),
    );
  }
}
