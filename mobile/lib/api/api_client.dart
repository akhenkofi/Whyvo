import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  static String? sharedBearerToken;
  String? bearerToken;
  final String baseUrl;
  ApiClient({String? baseUrl})
      : baseUrl = baseUrl ?? const String.fromEnvironment('FARMSAVIOR_API_BASE_URL', defaultValue: 'https://api.farmsavior.com/api/v1');

  Future<Map<String, dynamic>> register(Map<String, dynamic> payload) async {
    final res = await http.post(Uri.parse('$baseUrl/auth/register'), headers: {'Content-Type': 'application/json'}, body: jsonEncode(payload));
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> login(Map<String, dynamic> payload) async {
    final res = await http.post(Uri.parse('$baseUrl/auth/login'), headers: {'Content-Type': 'application/json'}, body: jsonEncode(payload));
    final data = jsonDecode(res.body);
    if (data is Map<String, dynamic> && (data['access_token'] ?? '').toString().isNotEmpty) {
      bearerToken = data['access_token'].toString();
      sharedBearerToken = bearerToken;
    }
    return data;
  }

  Future<List<dynamic>> getListings() async {
    final res = await http.get(Uri.parse('$baseUrl/marketplace/listings'));
    return jsonDecode(res.body);
  }

  Map<String, String> _headers({bool json = false}) {
    final headers = <String, String>{};
    if (json) headers['Content-Type'] = 'application/json';
    final token = (bearerToken ?? sharedBearerToken ?? '').trim();
    if (token.isNotEmpty) headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  Future<List<dynamic>> getWeatherAlerts() async {
    final res = await http.get(Uri.parse('$baseUrl/weather/alerts'));
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> getGamesWallet() async {
    final res = await http.get(Uri.parse('$baseUrl/games/wallet'), headers: _headers());
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> getGamesLeaderboard({required String gameCode, String period = 'weekly', int limit = 20}) async {
    final uri = Uri.parse('$baseUrl/games/leaderboard').replace(queryParameters: {
      'game_code': gameCode,
      'period': period,
      'limit': '$limit',
    });
    final res = await http.get(uri, headers: _headers());
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> submitGameScore(Map<String, dynamic> payload) async {
    final res = await http.post(Uri.parse('$baseUrl/games/submit-score'), headers: _headers(json: true), body: jsonEncode(payload));
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> claimGameMission(Map<String, dynamic> payload) async {
    final res = await http.post(Uri.parse('$baseUrl/games/claim-mission'), headers: _headers(json: true), body: jsonEncode(payload));
    return jsonDecode(res.body);
  }
}
