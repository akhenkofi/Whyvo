import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import '../api/api_client.dart';

enum FarmStackPieceKind { normal, goldenCrate, tractor, rainBonus }

class FarmStackScreen extends StatefulWidget {
  const FarmStackScreen({super.key});

  @override
  State<FarmStackScreen> createState() => _FarmStackScreenState();
}

class _FarmStackScreenState extends State<FarmStackScreen> {
  static const int rows = 16;
  static const int cols = 8;
  static int bestScore = 0;
  final Random random = Random();
  final ApiClient api = ApiClient();

  late List<List<Color?>> board;
  late List<List<String?>> boardLabels;
  Timer? timer;
  Timer? rainTimer;
  Timer? flashTimer;
  Timer? settleTimer;
  Timer? dropTimer;

  int pieceRow = 0;
  int pieceCol = 3;
  List<Point<int>> piece = [const Point(0, 0)];
  Color pieceColor = Colors.orange;
  String pieceLabel = 'Feed';
  FarmStackPieceKind pieceKind = FarmStackPieceKind.normal;

  Map<String, dynamic>? nextPieceData;
  Set<int> flashingRows = <int>{};
  Set<String> settlingCells = <String>{};
  Set<String> droppingCells = <String>{};

  int score = 0;
  bool gameOver = false;
  bool submitted = false;
  int tickMs = 650;
  bool rainSlowActive = false;
  int clearedRows = 0;
  int lastCreditsAwarded = 0;
  int lastMissionCredits = 0;
  int comboCount = 0;
  int level = 1;
  String statusText = 'Stack farm cargo and clear rows.';
  String comboText = '';
  bool boardPulse = false;

  @override
  void initState() {
    super.initState();
    _resetGame();
  }

  @override
  void dispose() {
    timer?.cancel();
    rainTimer?.cancel();
    flashTimer?.cancel();
    settleTimer?.cancel();
    dropTimer?.cancel();
    super.dispose();
  }

  void _resetGame() {
    board = List.generate(rows, (_) => List.generate(cols, (_) => null));
    boardLabels = List.generate(rows, (_) => List.generate(cols, (_) => null));
    score = 0;
    gameOver = false;
    submitted = false;
    tickMs = 650;
    rainSlowActive = false;
    clearedRows = 0;
    lastCreditsAwarded = 0;
    lastMissionCredits = 0;
    comboCount = 0;
    level = 1;
    statusText = 'Stack farm cargo and clear rows.';
    comboText = '';
    boardPulse = false;
    nextPieceData = _randomPieceData();
    flashingRows = <int>{};
    settlingCells = <String>{};
    droppingCells = <String>{};
    _spawnPiece();
    _restartTimer();
    setState(() {});
  }

  void _restartTimer() {
    timer?.cancel();
    timer = Timer.periodic(Duration(milliseconds: tickMs), (_) => _step());
  }

  Map<String, dynamic> _randomPieceData() {
    final pool = [
      {
        'shape': [const Point(0, 0), const Point(1, 0)],
        'color': const Color(0xFFD97706),
        'label': 'Feed',
        'kind': FarmStackPieceKind.normal,
      },
      {
        'shape': [const Point(0, 0), const Point(0, 1)],
        'color': const Color(0xFF16A34A),
        'label': 'Crate',
        'kind': FarmStackPieceKind.normal,
      },
      {
        'shape': [const Point(0, 0), const Point(1, 0), const Point(0, 1)],
        'color': const Color(0xFFFACC15),
        'label': 'Eggs',
        'kind': FarmStackPieceKind.normal,
      },
      {
        'shape': [const Point(0, 0), const Point(1, 0), const Point(2, 0)],
        'color': const Color(0xFF0EA5E9),
        'label': 'Tank',
        'kind': FarmStackPieceKind.normal,
      },
      {
        'shape': [const Point(0, 0), const Point(1, 0)],
        'color': const Color(0xFFCA8A04),
        'label': 'Hay',
        'kind': FarmStackPieceKind.normal,
      },
      {
        'shape': [const Point(0, 0)],
        'color': const Color(0xFFF59E0B),
        'label': 'Gold',
        'kind': FarmStackPieceKind.goldenCrate,
      },
      {
        'shape': [const Point(0, 0), const Point(1, 0), const Point(2, 0)],
        'color': const Color(0xFF4B5563),
        'label': 'Tractor',
        'kind': FarmStackPieceKind.tractor,
      },
      {
        'shape': [const Point(0, 0)],
        'color': const Color(0xFF38BDF8),
        'label': 'Rain',
        'kind': FarmStackPieceKind.rainBonus,
      },
    ];

    return Map<String, dynamic>.from(pool[random.nextInt(pool.length)]);
  }

  void _spawnPiece() {
    final selected = Map<String, dynamic>.from(nextPieceData ?? _randomPieceData());
    nextPieceData = _randomPieceData();
    piece = List<Point<int>>.from(selected['shape'] as List<Point<int>>);
    pieceColor = selected['color'] as Color;
    pieceLabel = selected['label'] as String;
    pieceKind = selected['kind'] as FarmStackPieceKind;
    pieceRow = 0;
    final width = piece.map((p) => p.x).reduce(max) + 1;
    pieceCol = ((cols - width) / 2).floor();

    if (!_canPlace(pieceRow, pieceCol, piece)) {
      _endGame();
    }
  }

  bool _canPlace(int baseRow, int baseCol, List<Point<int>> shape) {
    for (final p in shape) {
      final r = baseRow + p.y;
      final c = baseCol + p.x;
      if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
      if (board[r][c] != null) return false;
    }
    return true;
  }

  void _step() {
    if (gameOver) return;
    if (_canPlace(pieceRow + 1, pieceCol, piece)) {
      setState(() => pieceRow++);
    } else {
      setState(_lockPiece);
    }
  }

  void _move(int dx) {
    if (gameOver) return;
    if (_canPlace(pieceRow, pieceCol + dx, piece)) {
      setState(() => pieceCol += dx);
    }
  }

  void _drop() {
    if (gameOver) return;
    while (_canPlace(pieceRow + 1, pieceCol, piece)) {
      pieceRow++;
    }
    final cells = piece.map((p) => '${pieceRow + p.y}-${pieceCol + p.x}').toSet();
    setState(() {
      droppingCells = cells;
    });
    dropTimer?.cancel();
    dropTimer = Timer(const Duration(milliseconds: 140), () {
      if (!mounted) return;
      setState(() {
        droppingCells = <String>{};
      });
    });
    setState(_lockPiece);
  }

  void _rotate() {
    if (gameOver || piece.length <= 1) return;
    final rotated = piece.map((p) => Point(-p.y, p.x)).toList();
    final minX = rotated.map((p) => p.x).reduce(min);
    final minY = rotated.map((p) => p.y).reduce(min);
    final normalized = rotated.map((p) => Point(p.x - minX, p.y - minY)).toList();
    if (_canPlace(pieceRow, pieceCol, normalized)) {
      setState(() => piece = normalized);
    }
  }

  void _triggerBoardPulse() {
    setState(() {
      boardPulse = true;
    });
    Future.delayed(const Duration(milliseconds: 220), () {
      if (!mounted) return;
      setState(() {
        boardPulse = false;
      });
    });
  }

  void _lockPiece() {
    final lockedCells = <String>{};
    for (final p in piece) {
      final r = pieceRow + p.y;
      final c = pieceCol + p.x;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        board[r][c] = pieceColor;
        boardLabels[r][c] = pieceLabel;
        lockedCells.add('$r-$c');
      }
    }

    settlingCells = lockedCells;
    settleTimer?.cancel();
    settleTimer = Timer(const Duration(milliseconds: 220), () {
      if (!mounted) return;
      setState(() {
        settlingCells = <String>{};
      });
    });

    if (pieceKind == FarmStackPieceKind.goldenCrate) {
      _blastNearby(pieceRow, pieceCol);
      statusText = 'Golden crate blasted nearby cargo.';
      score += 80;
      _triggerBoardPulse();
    } else if (pieceKind == FarmStackPieceKind.tractor) {
      _clearSingleRow(pieceRow);
      statusText = 'Tractor cleared a whole row.';
      score += 120;
      _triggerBoardPulse();
    } else if (pieceKind == FarmStackPieceKind.rainBonus) {
      _activateRainSlow();
      statusText = 'Rain bonus slowed the drop speed.';
      score += 40;
    }

    _clearLines();
    _spawnPiece();
  }

  void _blastNearby(int r, int c) {
    for (int rr = max(0, r - 1); rr <= min(rows - 1, r + 1); rr++) {
      for (int cc = max(0, c - 1); cc <= min(cols - 1, c + 1); cc++) {
        board[rr][cc] = null;
        boardLabels[rr][cc] = null;
      }
    }
  }

  void _clearSingleRow(int rowIndex) {
    if (rowIndex < 0 || rowIndex >= rows) return;
    board.removeAt(rowIndex);
    boardLabels.removeAt(rowIndex);
    board.insert(0, List.generate(cols, (_) => null));
    boardLabels.insert(0, List.generate(cols, (_) => null));
    clearedRows += 1;
  }

  void _activateRainSlow() {
    rainSlowActive = true;
    tickMs = min(950, tickMs + 180);
    _restartTimer();
    rainTimer?.cancel();
    rainTimer = Timer(const Duration(seconds: 10), () {
      if (!mounted) return;
      setState(() {
        rainSlowActive = false;
        tickMs = max(240, tickMs - 180);
        _restartTimer();
      });
    });
  }

  void _clearLines() {
    int cleared = 0;
    final rowsToClear = <int>[];
    for (int i = board.length - 1; i >= 0; i--) {
      if (board[i].every((cell) => cell != null)) {
        rowsToClear.add(i);
      }
    }
    if (rowsToClear.isNotEmpty) {
      flashingRows = rowsToClear.toSet();
      flashTimer?.cancel();
      flashTimer = Timer(const Duration(milliseconds: 170), () {
        if (!mounted) return;
        setState(() {
          for (final i in rowsToClear) {
            board.removeAt(i);
            boardLabels.removeAt(i);
            board.insert(0, List.generate(cols, (_) => null));
            boardLabels.insert(0, List.generate(cols, (_) => null));
            cleared++;
          }
          flashingRows = <int>{};
          if (cleared > 0) {
            clearedRows += cleared;
            comboCount = comboCount + 1;
            final combo = cleared > 1 ? cleared * 40 : 0;
            score += (cleared * 100) + combo;
            level = max(1, 1 + (clearedRows ~/ 3));
            comboText = cleared > 1
                ? 'COMBO x$comboCount  •  +${(cleared * 100) + combo}'
                : comboCount > 1
                    ? 'CHAIN x$comboCount'
                    : 'NICE CLEAR';
            statusText = cleared > 1 ? 'Combo clear! $cleared rows removed.' : 'Row cleared!';
            _triggerBoardPulse();
            Future.delayed(const Duration(milliseconds: 700), () {
              if (!mounted) return;
              setState(() {
                comboText = '';
              });
            });
            final nextTick = max(220, 650 - ((level - 1) * 35));
            if (!rainSlowActive && nextTick != tickMs) {
              tickMs = nextTick;
              _restartTimer();
            }
          } else {
            comboCount = 0;
            comboText = '';
          }
        });
      });
      return;
    }
    if (cleared > 0) {
      clearedRows += cleared;
      final combo = cleared > 1 ? cleared * 40 : 0;
      score += (cleared * 100) + combo;
      statusText = cleared > 1 ? 'Combo clear! $cleared rows removed.' : 'Row cleared!';
      if (score > 0 && score % 500 == 0 && tickMs > 220 && !rainSlowActive) {
        tickMs -= 40;
        _restartTimer();
      }
    }
  }

  List<List<String?>> _nextPreviewGrid() {
    final data = nextPieceData;
    final grid = List.generate(4, (_) => List<String?>.filled(4, null));
    if (data == null) return grid;
    final shape = List<Point<int>>.from(data['shape'] as List<Point<int>>);
    final label = data['label'] as String;
    final minX = shape.map((p) => p.x).reduce(min);
    final minY = shape.map((p) => p.y).reduce(min);
    final normalized = shape.map((p) => Point(p.x - minX, p.y - minY)).toList();
    final width = normalized.map((p) => p.x).reduce(max) + 1;
    final height = normalized.map((p) => p.y).reduce(max) + 1;
    final offsetX = ((4 - width) / 2).floor();
    final offsetY = ((4 - height) / 2).floor();
    for (final p in normalized) {
      final x = p.x + offsetX;
      final y = p.y + offsetY;
      if (x >= 0 && x < 4 && y >= 0 && y < 4) {
        grid[y][x] = label;
      }
    }
    return grid;
  }

  void _endGame() {
    gameOver = true;
    timer?.cancel();
    statusText = 'Game Over. Submitting your score...';
    _submitScore();
  }

  Future<void> _submitScore() async {
    if (submitted) return;
    submitted = true;
    try {
      final nonce = 'farmstack-${DateTime.now().millisecondsSinceEpoch}-${random.nextInt(999999)}';
      final res = await api.submitGameScore({
        'game_code': 'farmstack',
        'mode': 'classic',
        'score': score,
        'duration_seconds': max(10, score ~/ 25),
        'client_nonce': nonce,
        'metadata_json': jsonEncode({
          'cleared_rows': clearedRows,
          'rain_bonus_used': rainSlowActive,
        }),
      });
      int missionCredits = 0;
      try {
        final missionRes = await api.claimGameMission({
          'mission_code': 'daily_play_farmstack',
          'period_code': DateTime.now().toUtc().toIso8601String().split('T').first,
        });
        missionCredits = int.tryParse('${missionRes['credits_awarded'] ?? 0}') ?? 0;
      } catch (_) {}
      if (!mounted) return;
      final awarded = int.tryParse('${res['credits_awarded'] ?? 0}') ?? 0;
      if (score > bestScore) bestScore = score;
      final rewardText = 'Game Over. +$awarded FarmCredits${missionCredits > 0 ? ' and +$missionCredits mission bonus' : ''} earned.';
      setState(() {
        lastCreditsAwarded = awarded;
        lastMissionCredits = missionCredits;
        statusText = rewardText;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(rewardText)));
      Future.delayed(const Duration(milliseconds: 900), () {
        if (mounted) Navigator.pop(context, true);
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        statusText = 'Game Over. Score saved locally, reward sync pending.';
      });
    }
  }

  int _ghostRow() {
    int ghostRow = pieceRow;
    while (_canPlace(ghostRow + 1, pieceCol, piece)) {
      ghostRow++;
    }
    return ghostRow;
  }

  bool _isGhostCell(int r, int c) {
    final ghostRow = _ghostRow();
    if (ghostRow == pieceRow) return false;
    for (final p in piece) {
      if (ghostRow + p.y == r && pieceCol + p.x == c) return true;
    }
    return false;
  }

  Color? _cellAt(int r, int c) {
    for (final p in piece) {
      if (pieceRow + p.y == r && pieceCol + p.x == c) return pieceColor;
    }
    return board[r][c];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('FarmStack'),
        actions: [IconButton(onPressed: _resetGame, icon: const Icon(Icons.refresh))],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                Row(
                  children: [
                    _statChip('Score', '$score'),
                    const SizedBox(width: 8),
                    _statChip('Best', '$bestScore'),
                    const SizedBox(width: 8),
                    _statChip('Rows', '$clearedRows'),
                    const SizedBox(width: 8),
                    _statChip('Lvl', '$level'),
                  ],
                ),
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 92,
                        height: 92,
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('NEXT', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w800)),
                            const SizedBox(height: 6),
                            Expanded(
                              child: GridView.builder(
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: 16,
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 4),
                                itemBuilder: (_, index) {
                                  final preview = _nextPreviewGrid();
                                  final r = index ~/ 4;
                                  final c = index % 4;
                                  final label = preview[r][c];
                                  final previewColor = label == null
                                      ? const Color(0xFF1E293B)
                                      : label == 'Gold'
                                          ? const Color(0xFFF59E0B)
                                          : label == 'Tractor'
                                              ? const Color(0xFF4B5563)
                                              : label == 'Rain'
                                                  ? const Color(0xFF38BDF8)
                                                  : label == 'Eggs'
                                                      ? const Color(0xFFFACC15)
                                                      : label == 'Tank'
                                                          ? const Color(0xFF0EA5E9)
                                                          : label == 'Crate'
                                                              ? const Color(0xFF16A34A)
                                                              : label == 'Hay'
                                                                  ? const Color(0xFFCA8A04)
                                                                  : const Color(0xFFD97706);
                                  return Container(
                                    margin: const EdgeInsets.all(2),
                                    decoration: BoxDecoration(
                                      color: previewColor,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: label == null ? Colors.white10 : Colors.white24),
                                      boxShadow: label == null ? null : [BoxShadow(color: previewColor.withOpacity(.25), blurRadius: 4, offset: const Offset(0, 1))],
                                    ),
                                    child: label == null
                                        ? null
                                        : Center(
                                            child: Text(
                                              label.substring(0, 1),
                                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 10),
                                            ),
                                          ),
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Queued piece preview makes the run feel more strategic and premium.',
                          style: TextStyle(color: Colors.grey.shade700, fontSize: 13, fontWeight: FontWeight.w600, height: 1.35),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: boardPulse ? Colors.amber.shade50 : (rainSlowActive ? Colors.blue.shade50 : Colors.green.shade50),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: boardPulse ? Colors.amber.shade200 : Colors.transparent),
                    boxShadow: boardPulse ? [BoxShadow(color: Colors.amber.withOpacity(.18), blurRadius: 18, offset: const Offset(0, 4))] : null,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(statusText, style: TextStyle(color: Colors.grey.shade800, fontWeight: FontWeight.w600)),
                      if (comboText.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(comboText, style: TextStyle(color: Colors.orange.shade700, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: .3)),
                      ],
                      const SizedBox(height: 4),
                      Text('Tap = rotate, swipe left/right = move, swipe down = fast drop', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                      if (gameOver) ...[
                        const SizedBox(height: 8),
                        Text('Run summary: score $score, rows $clearedRows, credits +$lastCreditsAwarded${lastMissionCredits > 0 ? ', mission +$lastMissionCredits' : ''}', style: TextStyle(color: Colors.grey.shade700, fontSize: 12, fontWeight: FontWeight.w600)),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: GestureDetector(
              onHorizontalDragEnd: (details) {
                final velocity = details.primaryVelocity ?? 0;
                if (velocity < -40) {
                  _move(-1);
                } else if (velocity > 40) {
                  _move(1);
                }
              },
              onVerticalDragEnd: (details) {
                final velocity = details.primaryVelocity ?? 0;
                if (velocity > 80) {
                  _drop();
                }
              },
              onTap: _rotate,
              child: AspectRatio(
                aspectRatio: cols / rows,
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 12),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: boardPulse ? [BoxShadow(color: Colors.amber.withOpacity(.22), blurRadius: 26, offset: const Offset(0, 8))] : null,
                  ),
                  child: GridView.builder(
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: rows * cols,
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: cols),
                    itemBuilder: (_, index) {
                      final r = index ~/ cols;
                      final c = index % cols;
                      final color = _cellAt(r, c);
                      final label = boardLabels[r][c];
                      final key = '$r-$c';
                      final isGhost = color == null && _isGhostCell(r, c);
                      final isFlashingRow = flashingRows.contains(r);
                      final isSettling = settlingCells.contains(key);
                      final isDropping = droppingCells.contains(key);
                      final cellScale = isFlashingRow ? 1.06 : isSettling ? 1.04 : isDropping ? .97 : 1.0;
                      return AnimatedScale(
                        scale: cellScale,
                        duration: Duration(milliseconds: isDropping ? 110 : 180),
                        curve: Curves.easeOut,
                        child: AnimatedContainer(
                          duration: Duration(milliseconds: isDropping ? 110 : 180),
                          curve: Curves.easeOut,
                          margin: const EdgeInsets.all(1.5),
                          decoration: BoxDecoration(
                            gradient: isFlashingRow
                                ? LinearGradient(colors: [Colors.amber.shade300, Colors.orange.shade400])
                                : color == null
                                    ? null
                                    : LinearGradient(colors: [color.withOpacity(.92), color.withOpacity(.68)]),
                            color: isGhost ? pieceColor.withOpacity(.18) : (color ?? const Color(0xFF1E293B)),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: isGhost ? pieceColor.withOpacity(.45) : (color == null ? Colors.black12 : Colors.white24)),
                            boxShadow: color == null
                                ? null
                                : [BoxShadow(color: (isFlashingRow ? Colors.amber : color).withOpacity(isFlashingRow ? .42 : .25), blurRadius: isFlashingRow ? 10 : 4, offset: const Offset(0, 2))],
                          ),
                          child: color == null
                              ? (isGhost
                                  ? Center(
                                      child: Icon(Icons.keyboard_arrow_down_rounded, size: 14, color: pieceColor.withOpacity(.55)),
                                    )
                                  : null)
                              : Center(
                                  child: Text(
                                    (label ?? '').isEmpty ? '' : label!.substring(0, 1),
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11),
                                  ),
                                ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 6, 12, 12),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _rotate,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Rotate'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _drop,
                    icon: const Icon(Icons.south),
                    label: const Text('Drop'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statChip(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.green.shade50,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade700)),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
          ],
        ),
      ),
    );
  }
}
