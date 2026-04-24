import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import 'screens/home_screen.dart';
import 'services/call_push_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
    await CallPushService.init();
  } catch (e) {
    debugPrint('Push init skipped: $e');
  }
  runApp(const FarmSaviorApp());
}

class FarmSaviorApp extends StatelessWidget {
  const FarmSaviorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FarmSavior',
      theme: ThemeData(primarySwatch: Colors.green),
      home: const HomeScreen(),
    );
  }
}
