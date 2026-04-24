import 'package:flutter/material.dart';
import '../api/api_client.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final api = ApiClient();
  final name = TextEditingController();
  final phone = TextEditingController();
  String country = 'GH';
  String role = 'Farmer';
  String result = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Register')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          TextField(controller: name, decoration: const InputDecoration(labelText: 'Full name')),
          TextField(controller: phone, decoration: const InputDecoration(labelText: 'Phone')),
          DropdownButton<String>(value: country, items: ['GH','NG','BF'].map((e)=>DropdownMenuItem(value:e, child: Text(e))).toList(), onChanged: (v)=>setState(()=>country=v!)),
          DropdownButton<String>(value: role, items: ['Farmer','Buyer','Transporter','EquipmentProvider','StorageProvider'].map((e)=>DropdownMenuItem(value:e, child: Text(e))).toList(), onChanged: (v)=>setState(()=>role=v!)),
          ElevatedButton(onPressed: () async {
            final res = await api.register({'full_name': name.text, 'phone': phone.text, 'country': country, 'role': role});
            setState(() => result = res.toString());
          }, child: const Text('Submit')),
          ElevatedButton(onPressed: () async {
            final res = await api.login({'identifier': phone.text, 'password': '123456'});
            setState(() => result = res.toString());
          }, child: const Text('Quick Login Test')),
          Text(result),
        ]),
      ),
    );
  }
}
