class AppNotification {
  AppNotification({
    required this.id,
    required this.channel,
    required this.subject,
    required this.body,
    required this.status,
    required this.createdAt,
    this.payload,
    this.readAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: json['id'] as String,
        channel: json['channel'] as String,
        subject: json['subject'] as String? ?? '',
        body: json['body'] as String? ?? '',
        status: json['status'] as String,
        payload: json['payload'] as Map<String, dynamic>?,
        readAt: json['read_at'] != null ? DateTime.tryParse(json['read_at'] as String) : null,
        createdAt: DateTime.parse(json['created_at'] as String),
      );

  final String id;
  final String channel;
  final String subject;
  final String body;
  final String status;
  final Map<String, dynamic>? payload;
  final DateTime? readAt;
  final DateTime createdAt;

  bool get isRead => readAt != null || status == 'read';
}
