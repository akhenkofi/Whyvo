import 'package:flutter/material.dart';
import '../api/api_client.dart';
import 'farmstack_screen.dart';

class GamesHubScreen extends StatefulWidget {
  const GamesHubScreen({super.key});

  @override
  State<GamesHubScreen> createState() => _GamesHubScreenState();
}

class _GamesHubScreenState extends State<GamesHubScreen> with SingleTickerProviderStateMixin {
  final api = ApiClient();
  Map<String, dynamic>? wallet;
  Map<String, dynamic>? leaderboard;
  bool loading = true;
  String error = '';
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _load();
  }

  Future<void> _load({bool quiet = false}) async {
    if (!quiet) {
      setState(() {
        loading = true;
        error = '';
      });
    } else {
      error = '';
    }
    try {
      final walletData = await api.getGamesWallet();
      final leaderboardData = await api.getGamesLeaderboard(gameCode: 'farmstack');
      setState(() {
        wallet = walletData;
        leaderboard = leaderboardData;
        loading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  Widget _buildPlayTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _heroCard(),
        const SizedBox(height: 16),
        _gameCard(
          title: 'FarmStack',
          subtitle: 'Falling cargo puzzle with crates, tractors, rain boosts, and FarmCredits rewards.',
          badge: 'Live',
          onTap: () async {
            final changed = await Navigator.push(context, MaterialPageRoute(builder: (_) => const FarmStackScreen()));
            if (changed == true) {
              _load(quiet: true);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('FarmStack rewards synced.')));
              }
            }
          },
        ),
        _gameCard(
          title: 'Farm Runner',
          subtitle: 'Endless runner with produce, boosts, and obstacles.',
          badge: 'Phase 2',
          disabled: true,
        ),
        _gameCard(
          title: 'Trade Tycoon',
          subtitle: 'Idle farm empire with upgrades and offline income.',
          badge: 'Phase 3',
          disabled: true,
        ),
      ],
    );
  }

  Widget _heroCard() {
    final credits = wallet?['credits_balance'] ?? 0;
    final streak = wallet?['current_streak_days'] ?? 0;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(colors: [Color(0xFF166534), Color(0xFF0F766E), Color(0xFF2563EB)]),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('FarmSavior Games Hub', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          const Text('Play quick farm games, earn FarmCredits, and climb the leaderboard.', style: TextStyle(color: Colors.white70)),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(child: _statPill('FarmCredits', '$credits')),
              const SizedBox(width: 10),
              Expanded(child: _statPill('Streak', '$streak days')),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statPill(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _gameCard({required String title, required String subtitle, required String badge, VoidCallback? onTap, bool disabled = false}) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text(subtitle),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: disabled ? Colors.grey.shade200 : Colors.green.shade50,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(badge, style: TextStyle(color: disabled ? Colors.grey.shade700 : Colors.green.shade800, fontWeight: FontWeight.w700, fontSize: 12)),
            )
          ],
        ),
        onTap: disabled ? null : onTap,
      ),
    );
  }

  Widget _buildLeaderboardTab() {
    final leaders = (leaderboard?['leaders'] as List?) ?? [];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('FarmStack Weekly Leaderboard', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),
        if (leaders.isEmpty)
          const Card(child: Padding(padding: EdgeInsets.all(16), child: Text('No leaderboard entries yet.'))),
        ...leaders.asMap().entries.map((entry) {
          final rank = entry.key + 1;
          final row = entry.value as Map<String, dynamic>;
          return Card(
            child: ListTile(
              leading: CircleAvatar(child: Text('$rank')),
              title: Text('${row['full_name'] ?? 'Player'}'),
              trailing: Text('${row['score'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.w800)),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildRewardsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        Text('Today\'s Missions', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
        SizedBox(height: 12),
        Card(child: ListTile(leading: Icon(Icons.agriculture, color: Colors.green), title: Text('Play FarmStack 1 time'), subtitle: Text('+25 FarmCredits'))),
        Card(child: ListTile(leading: Icon(Icons.directions_run, color: Colors.orange), title: Text('Run 500m in Farm Runner'), subtitle: Text('+25 FarmCredits'))),
        Card(child: ListTile(leading: Icon(Icons.storefront, color: Colors.blue), title: Text('Collect idle earnings in Trade Tycoon'), subtitle: Text('+25 FarmCredits'))),
      ],
    );
  }

  Widget _buildWalletTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: ListTile(
            title: const Text('FarmCredits Balance'),
            trailing: Text('${wallet?['credits_balance'] ?? 0}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          ),
        ),
        Card(
          child: ListTile(
            title: const Text('Lifetime Earned'),
            trailing: Text('${wallet?['lifetime_credits_earned'] ?? 0}'),
          ),
        ),
        Card(
          child: ListTile(
            title: const Text('Current Streak'),
            trailing: Text('${wallet?['current_streak_days'] ?? 0} days'),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Games Hub'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Play'),
            Tab(text: 'Leaderboards'),
            Tab(text: 'Rewards'),
            Tab(text: 'Wallet'),
          ],
        ),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : error.isNotEmpty
              ? Center(child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(error, textAlign: TextAlign.center),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  ),
                ))
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildPlayTab(),
                    _buildLeaderboardTab(),
                    _buildRewardsTab(),
                    _buildWalletTab(),
                  ],
                ),
    );
  }
}
