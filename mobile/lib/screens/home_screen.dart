import 'package:flutter/material.dart';
import 'register_screen.dart';
import 'marketplace_screen.dart';
import 'farmer_passport_screen.dart';
import 'weather_alerts_screen.dart';
import 'games_hub_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('FarmSavior MVP')),
      body: ListView(
        children: [
          ListTile(title: const Text('Register User'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen()))),
          ListTile(title: const Text('Digital Farm Passport'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FarmerPassportScreen()))),
          ListTile(title: const Text('Marketplace'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MarketplaceScreen()))),
          ListTile(title: const Text('Games Hub'), subtitle: const Text('FarmCredits, leaderboards, and mini-games'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GamesHubScreen()))),
          ListTile(title: const Text('Weather Alerts'), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const WeatherAlertsScreen()))),
        ],
      ),
    );
  }
}
