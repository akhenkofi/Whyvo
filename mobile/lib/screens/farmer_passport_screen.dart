import 'package:flutter/material.dart';

class FarmerPassportScreen extends StatelessWidget {
  const FarmerPassportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Digital Farm Passport')),
      body: const Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Fields included in backend API:'),
            SizedBox(height: 8),
            Text('- GPS latitude/longitude'),
            Text('- Farm size (hectares)'),
            Text('- Crops summary JSON'),
            Text('- Livestock summary JSON'),
            Text('- Photo URLs placeholders'),
          ],
        ),
      ),
    );
  }
}
