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
  final region = TextEditingController(text: 'Accra');
  final password = TextEditingController();
  final otp = TextEditingController();

  String country = 'GH';
  String role = 'Farmer';
  bool acceptedTerms = true;
  bool acceptedPrivacy = true;
  bool otpRequested = false;
  bool loading = false;
  String otpDestination = '';
  String status = '';
  Map<String, dynamic>? me;

  @override
  void dispose() {
    name.dispose();
    phone.dispose();
    region.dispose();
    password.dispose();
    otp.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    setState(() {
      loading = true;
      status = '';
      me = null;
    });
    try {
      final res = await api.register({
        'full_name': name.text.trim(),
        'phone': phone.text.trim(),
        'country': country,
        'region': region.text.trim().isEmpty ? 'Accra' : region.text.trim(),
        'user_type': role,
        'password': password.text,
        'accept_terms': acceptedTerms,
        'accept_privacy': acceptedPrivacy,
        'signup_method': 'phone',
      });
      setState(() {
        otpRequested = true;
        otpDestination = (res['otp_destination'] ?? phone.text.trim()).toString();
        final sent = res['otp_sent'] == true;
        final mock = (res['otp_mock_code'] ?? '').toString();
        final error = (res['otp_error'] ?? '').toString();
        status = sent
            ? 'OTP sent to $otpDestination'
            : 'OTP created for $otpDestination${error.isNotEmpty ? ' ($error)' : ''}${mock.isNotEmpty ? '\nTest code: $mock' : ''}';
      });
    } catch (e) {
      setState(() => status = 'Registration failed: $e');
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  Future<void> _verifyOtp() async {
    setState(() {
      loading = true;
      status = '';
      me = null;
    });
    try {
      final res = await api.verifyOtp({
        'destination': otpDestination.isEmpty ? phone.text.trim() : otpDestination,
        'code': otp.text.trim(),
      });
      final profile = await api.getMe();
      setState(() {
        me = profile;
        status = 'Phone verified and signed in.';
      });
      debugPrint('OTP verify response: $res');
    } catch (e) {
      setState(() => status = 'OTP verification failed: $e');
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Register')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(controller: name, decoration: const InputDecoration(labelText: 'Full name')),
            TextField(controller: phone, decoration: const InputDecoration(labelText: 'Phone')),
            TextField(controller: region, decoration: const InputDecoration(labelText: 'Region')),
            TextField(
              controller: password,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: country,
              decoration: const InputDecoration(labelText: 'Country'),
              items: ['GH', 'NG', 'BF']
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: loading ? null : (v) => setState(() => country = v ?? 'GH'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: role,
              decoration: const InputDecoration(labelText: 'Role'),
              items: ['Farmer', 'Buyer', 'Transporter', 'EquipmentProvider', 'StorageProvider']
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: loading ? null : (v) => setState(() => role = v ?? 'Farmer'),
            ),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              value: acceptedTerms,
              title: const Text('Accept Terms of Service'),
              onChanged: loading ? null : (v) => setState(() => acceptedTerms = v ?? false),
            ),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              value: acceptedPrivacy,
              title: const Text('Accept Privacy Policy'),
              onChanged: loading ? null : (v) => setState(() => acceptedPrivacy = v ?? false),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: loading ? null : _register,
              child: Text(loading ? 'Working...' : 'Send verification code'),
            ),
            if (otpRequested) ...[
              const SizedBox(height: 20),
              TextField(controller: otp, decoration: const InputDecoration(labelText: 'OTP code')),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: loading ? null : _verifyOtp,
                child: const Text('Verify and sign in'),
              ),
            ],
            if (status.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(status),
            ],
            if (me != null) ...[
              const SizedBox(height: 16),
              const Text('Signed in profile', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(me.toString()),
            ],
          ],
        ),
      ),
    );
  }
}
