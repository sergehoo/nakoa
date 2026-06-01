import 'package:intl/intl.dart';

String formatCurrency(num value, [String currency = 'XOF', String locale = 'fr_FR']) {
  final formatter = NumberFormat.currency(
    locale: locale,
    name: currency,
    symbol: currency == 'XOF' ? 'XOF' : currency,
    decimalDigits: currency == 'XOF' ? 0 : 2,
  );
  return formatter.format(value);
}

String formatDate(DateTime date, [String locale = 'fr_FR']) =>
    DateFormat.yMMMd(locale).format(date);

String formatDateTime(DateTime date, [String locale = 'fr_FR']) =>
    DateFormat.yMMMd(locale).add_Hm().format(date);

String relative(DateTime date, [String locale = 'fr_FR']) {
  final now = DateTime.now();
  final diff = now.difference(date);
  if (diff.inMinutes < 1) return 'à l\'instant';
  if (diff.inMinutes < 60) return 'il y a ${diff.inMinutes} min';
  if (diff.inHours < 24) return 'il y a ${diff.inHours} h';
  if (diff.inDays < 7) return 'il y a ${diff.inDays} j';
  return formatDate(date, locale);
}
