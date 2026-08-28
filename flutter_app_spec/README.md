# FF Arena - Flutter Mobile (Android MVP) Architecture Spec

This directory contains the architecture and implementation blueprint for building the native **FF Arena** Android application with Flutter & Supabase.

---

## 1. Tech Stack
- **Framework**: Flutter 3.29+ / Dart 3.x
- **State Management**: Riverpod (`flutter_riverpod: ^2.6.1`)
- **Backend & Database**: Supabase Flutter (`supabase_flutter: ^2.8.0`)
- **Push Notifications**: Firebase Messaging (`firebase_messaging: ^15.2.0`)
- **On-Device OCR Engine**: Google ML Kit (`google_mlkit_text_recognition: ^0.14.0`)
- **QR Code Verification**: `qr_flutter: ^4.1.0`
- **Cached Images**: `cached_network_image: ^3.4.1`

---

## 2. Directory Structure

```
lib/
├── core/
│   ├── constants/
│   │   ├── colors.dart       # FF Dark (#080B11), FF Orange (#FF5E14), Cyber Amber (#FFAA00)
│   │   └── api_routes.dart   # Supabase Edge function endpoints
│   ├── theme/
│   │   └── app_theme.dart    # Dark esports theme with glowing borders
│   └── utils/
│       ├── scoring_engine.dart # Total = Placement_Pts + (Kills * Multiplier)
│       └── elo_calculator.dart # Bronze to Grandmaster tier thresholds
├── features/
│   ├── auth/
│   │   ├── screens/login_screen.dart
│   │   ├── screens/uid_binding_screen.dart
│   │   └── controllers/auth_controller.dart
│   ├── tournaments/
│   │   ├── screens/tournament_list_screen.dart
│   │   ├── screens/tournament_detail_screen.dart
│   │   └── widgets/tournament_card.dart
│   ├── custom_room/
│   │   ├── screens/live_room_screen.dart
│   │   └── widgets/countdown_timer_widget.dart
│   ├── results_ocr/
│   │   ├── screens/submit_result_screen.dart
│   │   └── services/mlkit_ocr_service.dart
│   ├── teams/
│   │   ├── screens/team_hub_screen.dart
│   │   └── widgets/roster_list_item.dart
│   ├── rankings/
│   │   ├── screens/leaderboard_screen.dart
│   │   └── widgets/tier_badge_widget.dart
│   └── profile/
│       ├── screens/profile_screen.dart
│       └── widgets/stats_grid.dart
└── main.dart
```

---

## 3. Core Free Fire Result OCR Pipeline in Flutter

```dart
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';

class FreeFireResultVerifier {
  final _textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);

  Future<Map<String, dynamic>> extractMatchResult(String imagePath) async {
    final inputImage = InputImage.fromFilePath(imagePath);
    final RecognizedText recognizedText = await _textRecognizer.processImage(inputImage);
    
    // Parse recognized lines for "BOOYAH", "KILLS", "PLACEMENT"
    int kills = 0;
    int placement = 12;
    
    for (TextBlock block in recognizedText.blocks) {
      for (TextLine line in block.lines) {
        final text = line.text.toUpperCase();
        if (text.contains('BOOYAH') || text.contains('#1')) {
          placement = 1;
        }
        if (text.contains('KILLS')) {
          // extract numeric kill frags
          final digits = RegExp(r'\d+').allMatches(text);
          if (digits.isNotEmpty) {
            kills = int.tryParse(digits.first.group(0) ?? '0') ?? 0;
          }
        }
      }
    }

    return {
      'kills': kills,
      'placement': placement,
      'raw_text': recognizedText.text,
      'confidence': 0.95
    };
  }
}
```
