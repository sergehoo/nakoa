class AppUser {
  AppUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.primaryRole,
    this.phone,
    this.kycLevel = 0,
    this.twoFactorEnabled = false,
    this.country = 'CI',
    this.preferredCurrency = 'XOF',
    this.avatar,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        email: json['email'] as String,
        fullName: (json['full_name'] ?? '${json['first_name'] ?? ''} ${json['last_name'] ?? ''}').toString().trim(),
        primaryRole: json['primary_role'] as String? ?? 'customer',
        phone: json['phone'] as String?,
        kycLevel: (json['kyc_level'] as num?)?.toInt() ?? 0,
        twoFactorEnabled: json['two_factor_enabled'] as bool? ?? false,
        country: json['country'] as String? ?? 'CI',
        preferredCurrency: json['preferred_currency'] as String? ?? 'XOF',
        avatar: json['avatar'] as String?,
      );

  final String id;
  final String email;
  final String fullName;
  final String primaryRole;
  final String? phone;
  final int kycLevel;
  final bool twoFactorEnabled;
  final String country;
  final String preferredCurrency;
  final String? avatar;

  bool get isCustomer => primaryRole == 'customer' || primaryRole == 'customer_corporate';
  bool get isPrinter =>
      primaryRole == 'printer' || primaryRole == 'printer_agent' || primaryRole == 'quality_controller';
  bool get isCourier => primaryRole == 'courier';

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'full_name': fullName,
        'primary_role': primaryRole,
        'phone': phone,
        'kyc_level': kycLevel,
        'two_factor_enabled': twoFactorEnabled,
        'country': country,
        'preferred_currency': preferredCurrency,
        'avatar': avatar,
      };
}
