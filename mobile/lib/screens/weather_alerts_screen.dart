import 'package:flutter/material.dart';
import '../api/api_client.dart';

class WeatherAlertsScreen extends StatefulWidget {
  const WeatherAlertsScreen({super.key});

  @override
  State<WeatherAlertsScreen> createState() => _WeatherAlertsScreenState();
}

class _WeatherAlertsScreenState extends State<WeatherAlertsScreen> {
  final api = ApiClient();
  List<dynamic> alerts = [];

  @override
  void initState() {
    super.initState();
    api.getWeatherAlerts().then((v) => setState(() => alerts = v));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Weather Alerts')),
      body: ListView.builder(
        itemCount: alerts.length,
        itemBuilder: (_, i) {
          final a = alerts[i];
          return ListTile(
            title: Text('${a['alert_type']} (${a['severity']})'),
            subtitle: Text(a['message']),
          );
        },
      ),
    );
  }
}
