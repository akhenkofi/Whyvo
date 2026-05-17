import 'dart:convert';
import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_callkit_incoming/flutter_callkit_incoming.dart';

import 'package:http/http.dart' as http;

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await CallPushService.handleIncoming(message.data);
}

class CallPushService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  static Future<void> init() async {
    await _messaging.requestPermission(alert: true, badge: true, sound: true, criticalAlert: true, provisional: false);

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    FirebaseMessaging.onMessage.listen((msg) async {
      await handleIncoming(msg.data);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((msg) async {
      await handleIncoming(msg.data, openedFromTap: true);
    });

    final initial = await _messaging.getInitialMessage();
    if (initial != null) {
      await handleIncoming(initial.data, openedFromTap: true);
    }

    final token = await _messaging.getToken();
    if (token != null && token.isNotEmpty) {
      await _registerToken(token, platform: Platform.isIOS ? 'ios' : 'android');
    }

    _messaging.onTokenRefresh.listen((token) async {
      await _registerToken(token, platform: Platform.isIOS ? 'ios' : 'android');
    });
  }

  static Future<void> _registerToken(String token, {required String platform}) async {
    try {
      const baseUrl = String.fromEnvironment(
        'WHYVO_API_BASE_URL',
        defaultValue: String.fromEnvironment(
          'FARMSAVIOR_API_BASE_URL',
          defaultValue: 'http://127.0.0.1:8000/api/v1',
        ),
      );
      await http.post(
        Uri.parse('$baseUrl/messaging/device-token'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'platform': platform, 'token': token}),
      );
    } catch (e) {
      debugPrint('Device token registration failed: $e');
    }
  }

  static Future<void> handleIncoming(Map<String, dynamic> data, {bool openedFromTap = false}) async {
    final type = (data['type'] ?? '').toString().toLowerCase();
    if (type != 'incoming_call') return;

    final callId = (data['callId'] ?? data['call_id'] ?? DateTime.now().millisecondsSinceEpoch.toString()).toString();
    final mode = (data['mode'] ?? 'audio').toString();

    final params = <String, dynamic>{
      'id': callId,
      'nameCaller': data['caller_name']?.toString() ?? 'FarmSavior Call',
      'appName': 'FarmSavior',
      'handle': mode == 'video' ? 'Video call' : 'Audio call',
      'type': mode == 'video' ? 1 : 0,
      'duration': 30000,
      'textAccept': 'Accept',
      'textDecline': 'Decline',
      'extra': {
        'mode': mode,
        'url': data['url']?.toString() ?? '/?go=community',
        'callId': callId,
      },
      'android': {
        'isCustomNotification': true,
        'isShowLogo': true,
        'ringtonePath': 'system_ringtone_default',
        'backgroundColor': '#0f172a',
        'actionColor': '#16a34a',
      },
      'ios': {
        'iconName': 'AppIcon',
        'handleType': 'generic',
        'supportsVideo': true,
      },
    };

    try {
      await FlutterCallkitIncoming.showCallkitIncoming(params);
    } catch (e) {
      debugPrint('Callkit incoming display failed: $e');
    }

    if (openedFromTap) {
      // Existing in-app call flow should take over by routing using callId/url.
      debugPrint('Incoming call opened from notification: ${jsonEncode(params['extra'])}');
    }
  }
}
