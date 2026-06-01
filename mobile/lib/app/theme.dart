import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// Système de design PrintHub — couleurs, typographie, formes.
///
/// Aligné avec les tokens du web : primary `#1F3A5F`, accent `#10B981`,
/// radius 12px, ombres discrètes, dark/light avec contrastes WCAG AA.
class AppTheme {
  AppTheme._();

  // ===== Brand palette =====
  static const Color brandPrimary = Color(0xFF1F3A5F);
  static const Color brandPrimaryDark = Color(0xFF5B8BD8);
  static const Color brandAccent = Color(0xFF10B981);
  static const Color brandWarning = Color(0xFFF59E0B);
  static const Color brandDanger = Color(0xFFEF4444);
  static const Color brandSuccess = Color(0xFF22C55E);

  // ===== Light =====
  static ThemeData light() {
    final base = ThemeData.light(useMaterial3: true);
    final scheme = ColorScheme.fromSeed(
      seedColor: brandPrimary,
      brightness: Brightness.light,
      primary: brandPrimary,
      secondary: brandAccent,
      tertiary: brandWarning,
      error: brandDanger,
      surface: Colors.white,
    );
    return base.copyWith(
      colorScheme: scheme,
      scaffoldBackgroundColor: const Color(0xFFF7F9FC),
      textTheme: GoogleFonts.interTextTheme(base.textTheme),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: brandPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: _inputDecoration(scheme, Brightness.light),
      elevatedButtonTheme: _elevatedButton(scheme),
      filledButtonTheme: _filledButton(scheme),
      outlinedButtonTheme: _outlinedButton(scheme),
      textButtonTheme: _textButton(scheme),
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFFEEF2F7),
        side: BorderSide.none,
        shape: const StadiumBorder(),
        labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 12),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        elevation: 12,
        selectedItemColor: brandPrimary,
        unselectedItemColor: Color(0xFF94A3B8),
        type: BottomNavigationBarType.fixed,
      ),
      dividerTheme: const DividerThemeData(color: Color(0xFFE2E8F0), thickness: 1, space: 1),
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: brandPrimary,
        contentTextStyle: TextStyle(color: Colors.white),
      ),
    );
  }

  // ===== Dark =====
  static ThemeData dark() {
    final base = ThemeData.dark(useMaterial3: true);
    final scheme = ColorScheme.fromSeed(
      seedColor: brandPrimary,
      brightness: Brightness.dark,
      primary: brandPrimaryDark,
      secondary: brandAccent,
      tertiary: brandWarning,
      error: brandDanger,
      surface: const Color(0xFF141A25),
    );
    return base.copyWith(
      colorScheme: scheme,
      scaffoldBackgroundColor: const Color(0xFF0B0F17),
      textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(
        bodyColor: const Color(0xFFE5E7EB),
        displayColor: const Color(0xFFE5E7EB),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: const Color(0xFF0B0F17),
        foregroundColor: brandPrimaryDark,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: const Color(0xFF141A25),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: _inputDecoration(scheme, Brightness.dark),
      elevatedButtonTheme: _elevatedButton(scheme),
      filledButtonTheme: _filledButton(scheme),
      outlinedButtonTheme: _outlinedButton(scheme),
      textButtonTheme: _textButton(scheme),
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFF1F2937),
        side: BorderSide.none,
        shape: const StadiumBorder(),
        labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 12),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF141A25),
        elevation: 12,
        selectedItemColor: brandPrimaryDark,
        unselectedItemColor: Color(0xFF64748B),
        type: BottomNavigationBarType.fixed,
      ),
      dividerTheme: const DividerThemeData(color: Color(0xFF1F2937), thickness: 1, space: 1),
    );
  }

  static InputDecorationTheme _inputDecoration(ColorScheme scheme, Brightness brightness) {
    final fill = brightness == Brightness.light ? Colors.white : const Color(0xFF1A2230);
    final border = brightness == Brightness.light ? const Color(0xFFE2E8F0) : const Color(0xFF2A3447);
    return InputDecorationTheme(
      filled: true,
      fillColor: fill,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: scheme.primary, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: scheme.error),
      ),
    );
  }

  static ElevatedButtonThemeData _elevatedButton(ColorScheme scheme) => ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          backgroundColor: scheme.primary,
          foregroundColor: scheme.onPrimary,
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
          elevation: 0,
        ),
      );

  static FilledButtonThemeData _filledButton(ColorScheme scheme) => FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
        ),
      );

  static OutlinedButtonThemeData _outlinedButton(ColorScheme scheme) => OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          side: BorderSide(color: scheme.outline),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
        ),
      );

  static TextButtonThemeData _textButton(ColorScheme scheme) => TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: scheme.primary,
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      );
}
