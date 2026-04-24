import 'package:flutter/material.dart';
import '../api/api_client.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  final api = ApiClient();
  List<dynamic> listings = [];

  @override
  void initState() {
    super.initState();
    api.getListings().then((v) => setState(() => listings = v));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Marketplace')),
      body: ListView.builder(
        itemCount: listings.length,
        itemBuilder: (_, i) {
          final l = listings[i];
          return ListTile(
            title: Text('${l['crop_name']} - ${l['quantity_kg']}kg'),
            subtitle: Text('Status: ${l['status']} @ ${l['unit_price']}'),
          );
        },
      ),
    );
  }
}
