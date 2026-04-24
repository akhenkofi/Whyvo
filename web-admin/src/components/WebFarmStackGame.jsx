import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../services/api'

const ROWS = 16
const COLS = 8
const EMPTY = null
const BASE_TICK_MS = 660
const MIN_TICK_MS = 90
const SPEED_PRESETS = {
  slow: { label: 'Easy', tick: 720 },
  medium: { label: 'Medium', tick: 560 },
  fast: { label: 'Hard', tick: 400 },
}
const palette = { F: '#d97706', C: '#16a34a', E: '#facc15', T: '#0ea5e9', H: '#ca8a04', G: '#f59e0b', R: '#38bdf8', X: '#4b5563' }
const icons = { F: '▭', C: '◢', E: '◼', T: '✦', H: '▤', G: '★', R: '✧', X: '🚜' }
const basePieces = [
  { type: 'F', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
  { type: 'C', shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { type: 'E', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { type: 'T', shape: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  { type: 'H', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }] },
]
const specialPieces = [
  { type: 'G', shape: [{ x: 0, y: 0 }] },
  { type: 'R', shape: [{ x: 0, y: 0 }] },
  { type: 'X', shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }] },
]

const makeBoard = () => Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => EMPTY))
const randomSpawn = () => {
  const roll = Math.random()
  let chosen
  if (roll < 0.07) chosen = specialPieces[2]
  else if (roll < 0.14) chosen = specialPieces[Math.random() < 0.5 ? 0 : 1]
  else chosen = basePieces[Math.floor(Math.random() * basePieces.length)]
  return { type: chosen.type, shape: chosen.shape.map((p) => ({ ...p })) }
}
const normalize = (shape) => {
  const minX = Math.min(...shape.map((p) => p.x))
  const minY = Math.min(...shape.map((p) => p.y))
  return shape.map((p) => ({ x: p.x - minX, y: p.y - minY }))
}
const rotate = (shape) => normalize(shape.map((p) => ({ x: -p.y, y: p.x })))
const getLevel = (rowsCleared) => Math.max(1, 1 + Math.floor(rowsCleared / 3))
const getBaseTick = (level, speedMode = 'medium') => {
  const presetTick = SPEED_PRESETS[speedMode]?.tick ?? BASE_TICK_MS
  const perLevelDrop = speedMode === 'fast' ? 90 : speedMode === 'medium' ? 72 : 58
  const levelRamp = Math.max(0, level - 1)
  return Math.max(MIN_TICK_MS, presetTick - (levelRamp * perLevelDrop))
}
const applyGravity = (grid) => {
  for (let col = 0; col < COLS; col += 1) {
    const stack = []
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      if (grid[row][col]) stack.push(grid[row][col])
    }
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      grid[row][col] = stack[ROWS - 1 - row] || EMPTY
    }
  }
}

const cloneSpawn = (spawn) => ({ type: spawn.type, shape: spawn.shape.map((p) => ({ ...p })) })
const previewGridForPiece = (spawn) => {
  const normalized = normalize(spawn.shape)
  const width = Math.max(...normalized.map((p) => p.x)) + 1
  const height = Math.max(...normalized.map((p) => p.y)) + 1
  const offsetX = Math.floor((4 - width) / 2)
  const offsetY = Math.floor((4 - height) / 2)
  const grid = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => EMPTY))
  normalized.forEach((p) => {
    const x = p.x + offsetX
    const y = p.y + offsetY
    if (y >= 0 && y < 4 && x >= 0 && x < 4) grid[y][x] = spawn.type
  })
  return grid
}

export default function WebFarmStackGame({ onFinish, compact = false, storageKey = 'farmsavior_farm_stack_guest' }) {
  const first = randomSpawn()
  const queuedFirst = randomSpawn()
  const [board, setBoard] = useState(makeBoard)
  const [piece, setPiece] = useState({ shape: first.shape, row: 0, col: 2, type: first.type })
  const [nextPiece, setNextPiece] = useState(cloneSpawn(queuedFirst))
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [rowsCleared, setRowsCleared] = useState(0)
  const [level, setLevel] = useState(1)
  const [combo, setCombo] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [paused, setPaused] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [speedMode, setSpeedMode] = useState('medium')
  const [rewardText, setRewardText] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [soundOn, setSoundOn] = useState(false)
  const [tickMs, setTickMs] = useState(BASE_TICK_MS)
  const [rainSlow, setRainSlow] = useState(false)
  const [flashCells, setFlashCells] = useState([])
  const [highlightRows, setHighlightRows] = useState([])
  const [pulseBoard, setPulseBoard] = useState(false)
  const [tractorImpact, setTractorImpact] = useState(false)
  const [scorePop, setScorePop] = useState('')
  const [pieceDropFx, setPieceDropFx] = useState([])
  const [pieceSettledFx, setPieceSettledFx] = useState([])
  const touchStartRef = useRef(null)
  const pieceRef = useRef(piece)
  const boardRef = useRef(board)
  const audioContextRef = useRef(null)
  const rainTimerRef = useRef(null)
  const flashTimerRef = useRef(null)
  const rowFlashTimerRef = useRef(null)
  const pulseTimerRef = useRef(null)
  const scorePopTimerRef = useRef(null)
  const saveTimerRef = useRef(null)
  const dropFxTimerRef = useRef(null)
  const settleFxTimerRef = useRef(null)

  useEffect(() => { pieceRef.current = piece }, [piece])
  useEffect(() => { boardRef.current = board }, [board])

  useEffect(() => {
    if (!compact || typeof document === 'undefined') return undefined
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevBodyTouchAction = body.style.touchAction
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.touchAction = 'none'
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      body.style.touchAction = prevBodyTouchAction
    }
  }, [compact])

  useEffect(() => {
    let cancelled = false
    const loadState = async () => {
      if (!storageKey) return
      try {
        const response = await api.fetchGameState({ game_code: 'farmstack' })
        const raw = response?.state_json
        if (!raw) return
        const saved = JSON.parse(raw)
        if (cancelled || !saved || typeof saved !== 'object') return
        if (Number.isFinite(saved.best)) setBest(saved.best)
        if (typeof saved.speedMode === 'string') setSpeedMode(saved.speedMode)
        if (typeof saved.soundOn === 'boolean') setSoundOn(saved.soundOn)
      } catch {
        try {
          const raw = localStorage.getItem(storageKey)
          if (!raw) return
          const saved = JSON.parse(raw)
          if (!saved || typeof saved !== 'object') return
          if (Number.isFinite(saved.best)) setBest(saved.best)
          if (typeof saved.speedMode === 'string') setSpeedMode(saved.speedMode)
          if (typeof saved.soundOn === 'boolean') setSoundOn(saved.soundOn)
        } catch {}
      }
    }
    loadState()
    return () => { cancelled = true }
  }, [storageKey])

  useEffect(() => {
    if (!storageKey) return
    const payload = JSON.stringify({ best, speedMode, soundOn })
    try { localStorage.setItem(storageKey, payload) } catch {}
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      api.saveGameState({ game_code: 'farmstack', state_json: payload }).catch(() => {})
    }, 350)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [storageKey, best, speedMode, soundOn])

  const playSound = (type = 'tap') => {
    if (!soundOn || typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      if (!audioContextRef.current) audioContextRef.current = new AudioCtx()
      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const now = ctx.currentTime
      const tones = {
        tap: { freq: 420, dur: 0.05, vol: 0.018, type: 'triangle' },
        move: { freq: 300, dur: 0.04, vol: 0.015, type: 'square' },
        drop: { freq: 220, dur: 0.08, vol: 0.02, type: 'square' },
        clear: { freq: 620, dur: 0.12, vol: 0.03, type: 'triangle' },
        special: { freq: 760, dur: 0.14, vol: 0.032, type: 'sine' },
        gameover: { freq: 180, dur: 0.22, vol: 0.035, type: 'sawtooth' },
      }
      const tone = tones[type] || tones.tap
      osc.type = tone.type
      osc.frequency.setValueAtTime(tone.freq, now)
      if (type === 'clear' || type === 'special') osc.frequency.exponentialRampToValueAtTime(tone.freq * 1.18, now + tone.dur)
      if (type === 'gameover') osc.frequency.exponentialRampToValueAtTime(110, now + tone.dur)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(tone.vol, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + tone.dur)
    } catch {}
  }

  const canPlace = (shape, row, col, currentBoard = boardRef.current) => {
    for (const p of shape) {
      const r = row + p.y
      const c = col + p.x
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false
      if (currentBoard[r][c]) return false
    }
    return true
  }

  const centeredColForShape = (shape) => {
    const width = Math.max(...shape.map((p) => p.x)) + 1
    return Math.max(0, Math.floor((COLS - width) / 2))
  }

  const spawnPiece = (currentBoard = boardRef.current, scoreValue = score, rowsValue = rowsCleared, bestValue = best) => {
    const activeSpawn = cloneSpawn(nextPiece)
    const queuedSpawn = randomSpawn()
    const next = { shape: activeSpawn.shape, row: 0, col: centeredColForShape(activeSpawn.shape), type: activeSpawn.type }
    setNextPiece(cloneSpawn(queuedSpawn))
    if (!canPlace(next.shape, next.row, next.col, currentBoard)) {
      setGameOver(true)
      playSound('gameover')
      const finalBest = Math.max(bestValue, scoreValue)
      setBest(finalBest)
      onFinish?.({ score: scoreValue, rowsCleared: rowsValue, best: finalBest, rewardText: `Game over. Score ${scoreValue}, rows ${rowsValue}.` })
      return
    }
    setPiece(next)
  }

  const clearRow = (grid, rowIndex) => {
    grid.splice(rowIndex, 1)
    grid.unshift(Array.from({ length: COLS }, () => EMPTY))
  }

  const triggerBoardPulse = (variant = 'normal') => {
    setPulseBoard(variant)
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    pulseTimerRef.current = setTimeout(() => setPulseBoard(false), variant === 'tractor' ? 420 : 260)
  }

  const triggerScorePop = (text) => {
    setScorePop(text)
    if (scorePopTimerRef.current) clearTimeout(scorePopTimerRef.current)
    scorePopTimerRef.current = setTimeout(() => setScorePop(''), 720)
  }

  const lockPiece = (lockedPiece = pieceRef.current) => {
    const currentBoard = boardRef.current
    const nextBoard = currentBoard.map((row) => [...row])
    const flashed = []
    for (const p of lockedPiece.shape) {
      const rr = lockedPiece.row + p.y
      const cc = lockedPiece.col + p.x
      if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) {
        nextBoard[rr][cc] = lockedPiece.type
        flashed.push(`${rr}-${cc}`)
      }
    }

    let bonus = 0
    let nextRewardText = ''
    let specialClearRow = null

    if (lockedPiece.type === 'G') {
      for (let rr = Math.max(0, lockedPiece.row - 1); rr <= Math.min(ROWS - 1, lockedPiece.row + 1); rr++) {
        for (let cc = Math.max(0, lockedPiece.col - 1); cc <= Math.min(COLS - 1, lockedPiece.col + 1); cc++) {
          nextBoard[rr][cc] = EMPTY
          flashed.push(`${rr}-${cc}`)
        }
      }
      applyGravity(nextBoard)
      bonus += 110
      nextRewardText = 'Gold crate blasted nearby cargo.'
      playSound('special')
      triggerBoardPulse()
    }

    if (lockedPiece.type === 'X') {
      const targetRow = Math.min(ROWS - 1, Math.max(...lockedPiece.shape.map((p) => lockedPiece.row + p.y)))
      specialClearRow = targetRow
      clearRow(nextBoard, targetRow)
      bonus += 160
      nextRewardText = 'TRACTOR SMASH! Full row cleared. +160'
      playSound('special')
      setTractorImpact(true)
      triggerBoardPulse('tractor')
      triggerScorePop('+160')
    }

    if (lockedPiece.type === 'R') {
      if (rainTimerRef.current) clearTimeout(rainTimerRef.current)
      setRainSlow(true)
      bonus += 60
      nextRewardText = 'Rain slowed the field for a moment.'
      playSound('special')
      rainTimerRef.current = setTimeout(() => {
        setRainSlow(false)
      }, 8000)
    }

    let cleared = 0
    for (let row = ROWS - 1; row >= 0; row--) {
      if (nextBoard[row].every(Boolean)) {
        cleared += 1
        clearRow(nextBoard, row)
        row += 1
      }
    }

    const nextCombo = cleared > 0 ? combo + 1 : 0
    const lineScore = cleared === 0 ? 0 : [0, 160, 380, 680, 1100][Math.min(cleared, 4)]
    const comboBonus = cleared > 0 ? (nextCombo - 1) * 70 : 0
    const softProgress = 22 + (level * 10)
    const nextScore = score + softProgress + bonus + lineScore + comboBonus
    const nextRows = rowsCleared + cleared
    const nextLevel = getLevel(nextRows)
    const nextBest = Math.max(best, nextScore)
    const nextTickBase = getBaseTick(nextLevel, speedMode)
    const nextTick = rainSlow ? Math.round(nextTickBase * 1.35) : nextTickBase

    boardRef.current = nextBoard
    setBoard(nextBoard)
    setScore(nextScore)
    setRowsCleared(nextRows)
    setBest(nextBest)
    setLevel(nextLevel)
    setCombo(nextCombo)
    setTickMs(nextTick)
    setFlashCells(flashed)
    setPieceSettledFx(flashed)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlashCells([]), 240)
    if (settleFxTimerRef.current) clearTimeout(settleFxTimerRef.current)
    settleFxTimerRef.current = setTimeout(() => setPieceSettledFx([]), 260)
    if (specialClearRow !== null) {
      setHighlightRows([specialClearRow])
      if (rowFlashTimerRef.current) clearTimeout(rowFlashTimerRef.current)
      rowFlashTimerRef.current = setTimeout(() => {
        setHighlightRows([])
        setTractorImpact(false)
      }, 420)
    } else {
      setHighlightRows([])
      setTractorImpact(false)
    }

    if (cleared >= 4) {
      nextRewardText = `Harvest burst! ${cleared} rows cleared, huge reward.`
      playSound('clear')
      triggerBoardPulse()
    } else if (cleared > 0) {
      nextRewardText = `${cleared} row${cleared > 1 ? 's' : ''} cleared${nextCombo > 1 ? `, combo x${nextCombo}` : ''}. Nice stack.`
      playSound('clear')
      triggerBoardPulse()
    } else if (nextScore > 0 && nextScore % 500 < softProgress + bonus + Math.max(lineScore, 0) + Math.max(comboBonus, 0)) {
      nextRewardText = `Score milestone hit: ${nextScore}. Keep stacking.`
    } else if (!nextRewardText) nextRewardText = `Locked in. Level ${nextLevel}.`

    setRewardText(nextRewardText)
    spawnPiece(nextBoard, nextScore, nextRows, nextBest)
  }

  const tick = () => {
    if (gameOver || paused || showRules) return
    const currentPiece = pieceRef.current
    if (canPlace(currentPiece.shape, currentPiece.row + 1, currentPiece.col)) {
      setPiece((prev) => ({ ...prev, row: prev.row + 1 }))
    } else {
      lockPiece(currentPiece)
    }
  }

  useEffect(() => {
    if (gameOver || paused || showRules) return
    const timer = setInterval(tick, tickMs)
    return () => clearInterval(timer)
  }, [gameOver, paused, showRules, tickMs])

  useEffect(() => {
    const base = getBaseTick(level, speedMode)
    setTickMs(rainSlow ? Math.round(base * 1.35) : base)
  }, [level, rainSlow, speedMode])

  useEffect(() => {
    if (gameOver) return undefined
    const timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [gameOver])

  useEffect(() => () => {
    if (rainTimerRef.current) clearTimeout(rainTimerRef.current)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    if (rowFlashTimerRef.current) clearTimeout(rowFlashTimerRef.current)
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (dropFxTimerRef.current) clearTimeout(dropFxTimerRef.current)
    if (settleFxTimerRef.current) clearTimeout(settleFxTimerRef.current)
    try { audioContextRef.current?.close?.() } catch {}
    audioContextRef.current = null
  }, [])

  const move = (dx, amount = 1) => {
    if (gameOver || paused || showRules) return
    const currentPiece = pieceRef.current
    let nextCol = currentPiece.col
    for (let step = 0; step < amount; step += 1) {
      if (canPlace(currentPiece.shape, currentPiece.row, nextCol + dx)) nextCol += dx
      else break
    }
    if (nextCol !== currentPiece.col) {
      const movedPiece = { ...currentPiece, col: nextCol }
      pieceRef.current = movedPiece
      setPiece(movedPiece)
      playSound('move')
    }
  }

  const hardDrop = () => {
    if (gameOver || paused || showRules) return
    const currentPiece = pieceRef.current
    let row = currentPiece.row
    while (canPlace(currentPiece.shape, row + 1, currentPiece.col)) row += 1
    const droppedPiece = { ...currentPiece, row }
    const dropCells = droppedPiece.shape.map((p) => `${droppedPiece.row + p.y}-${droppedPiece.col + p.x}`)
    pieceRef.current = droppedPiece
    setPieceDropFx(dropCells)
    if (dropFxTimerRef.current) clearTimeout(dropFxTimerRef.current)
    dropFxTimerRef.current = setTimeout(() => setPieceDropFx([]), 170)
    setPiece(droppedPiece)
    playSound('drop')
    lockPiece(droppedPiece)
  }

  const rotatePiece = () => {
    if (gameOver || paused || showRules) return
    const currentPiece = pieceRef.current
    if (currentPiece.type === 'G' || currentPiece.type === 'R') return
    const nextShape = rotate(currentPiece.shape)
    if (canPlace(nextShape, currentPiece.row, currentPiece.col)) {
      setPiece((prev) => ({ ...prev, shape: nextShape }))
      playSound('tap')
      return
    }
    if (canPlace(nextShape, currentPiece.row, currentPiece.col - 1)) {
      setPiece((prev) => ({ ...prev, shape: nextShape, col: prev.col - 1 }))
      playSound('tap')
      return
    }
    if (canPlace(nextShape, currentPiece.row, currentPiece.col + 1)) {
      setPiece((prev) => ({ ...prev, shape: nextShape, col: prev.col + 1 }))
      playSound('tap')
    }
  }

  const reset = () => {
    if (rainTimerRef.current) clearTimeout(rainTimerRef.current)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    if (rowFlashTimerRef.current) clearTimeout(rowFlashTimerRef.current)
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    const nextSpawn = randomSpawn()
    const queuedSpawn = randomSpawn()
    const nextBoard = makeBoard()
    boardRef.current = nextBoard
    const nextPieceState = { shape: nextSpawn.shape, row: 0, col: centeredColForShape(nextSpawn.shape), type: nextSpawn.type }
    pieceRef.current = nextPieceState
    setBoard(nextBoard)
    setPiece(nextPieceState)
    setNextPiece(cloneSpawn(queuedSpawn))
    setScore(0)
    setRowsCleared(0)
    setLevel(1)
    setCombo(0)
    setBest(0)
    setGameOver(false)
    setPaused(false)
    setShowRules(false)
    setRewardText('')
    setElapsedSeconds(0)
    setTickMs(SPEED_PRESETS[speedMode]?.tick ?? BASE_TICK_MS)
    setRainSlow(false)
    setFlashCells([])
    setHighlightRows([])
    setPulseBoard(false)
    setPieceDropFx([])
    setPieceSettledFx([])
  }

  useEffect(() => {
  }, [gameOver])

  const visible = useMemo(() => {
    const grid = board.map((row) => [...row])
    if (!gameOver) {
      for (const p of piece.shape) {
        const r = piece.row + p.y
        const c = piece.col + p.x
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) grid[r][c] = piece.type
      }
    }
    return grid
  }, [board, piece, gameOver])

  const boardGap = compact ? 3 : 8
  const cellRadius = compact ? 9 : 12
  const controlButtonStyle = compact ? { padding:'8px 6px', fontSize:11 } : {}
  const timerLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`
  const nextPreviewGrid = useMemo(() => previewGridForPiece(nextPiece), [nextPiece])

  return <div style={{height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0, position:'relative'}}>
    <div style={{ display:'grid', gridTemplateColumns: compact ? 'repeat(5, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))', gap: compact ? 3 : 4, marginBottom: compact ? 3 : 6, color:'#fff', flex:'0 0 auto' }}>
      <div style={{padding: compact ? '4px 5px' : '6px 7px', borderRadius: compact ? 10 : 12, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.05)'}}><div style={{ fontSize:compact ? 7 : 8, opacity:.72 }}>Score</div><div style={{ fontSize:compact ? '.72rem' : '1.6rem', fontWeight:900 }}>{score}</div></div>
      <div style={{padding: compact ? '4px 5px' : '6px 7px', borderRadius: compact ? 10 : 12, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.05)'}}><div style={{ fontSize:compact ? 7 : 8, opacity:.72 }}>Time</div><div style={{ fontSize:compact ? '.7rem' : '1.1rem', fontWeight:800 }}>{timerLabel}</div></div>
      <div style={{padding: compact ? '4px 5px' : '6px 7px', borderRadius: compact ? 10 : 12, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.05)'}}><div style={{ fontSize:compact ? 7 : 8, opacity:.72 }}>Best</div><div style={{ fontSize:compact ? '.7rem' : '1.1rem', fontWeight:800 }}>{best}</div></div>
      <div style={{padding: compact ? '4px 5px' : '6px 7px', borderRadius: compact ? 10 : 12, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.05)'}}><div style={{ fontSize:compact ? 7 : 8, opacity:.72 }}>Level</div><div style={{ fontSize:compact ? '.7rem' : '1.1rem', fontWeight:800 }}>{level}</div></div>
      <div style={{padding: compact ? '4px 5px' : '6px 7px', borderRadius: compact ? 10 : 12, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.05)'}}><div style={{ fontSize:compact ? 7 : 8, opacity:.72 }}>Combo</div><div style={{ fontSize:compact ? '.7rem' : '1.1rem', fontWeight:800 }}>{combo > 1 ? `x${combo}` : '—'}</div></div>
    </div>
    <div style={{display:'flex', gap:6, marginBottom: compact ? 3 : 6, flexWrap:'wrap', flex:'0 0 auto'}}>
      <select className='input' value={speedMode} onChange={(e) => { const mode = e.target.value; setSpeedMode(mode); setLevel(1); setTickMs(SPEED_PRESETS[mode]?.tick ?? BASE_TICK_MS) }} style={{minWidth: compact ? 112 : 180, fontSize: compact ? 11 : 14, padding: compact ? '10px 12px' : undefined, height: compact ? 42 : undefined}}>
        {Object.entries(SPEED_PRESETS).map(([key, preset]) => <option key={key} value={key}>{preset.label}</option>)}
      </select>
      <button type='button' className='btn' style={compact ? {padding:'10px 14px', minHeight:42} : undefined} onClick={() => { setShowRules(false); setPaused((prev) => !prev) }}>{paused ? 'Resume' : 'Pause'}</button>
      <button type='button' className='btn' style={compact ? {padding:'10px 12px', minHeight:42} : undefined} onClick={() => setSoundOn((prev) => !prev)}>{soundOn ? 'Sound On' : 'Sound Off'}</button>
      {(paused || showRules) && <button type='button' className='btn btn-dark' style={compact ? {padding:'10px 14px', minHeight:42} : undefined} onClick={() => { setPaused(true); setShowRules((prev) => !prev) }}>{showRules ? 'Back to Pause' : 'Hint / Rules'}</button>}
      {paused && !showRules && <button type='button' className='btn' style={compact ? {padding:'10px 14px', minHeight:42} : undefined} onClick={reset}>Restart</button>}
    </div>
    <div style={{display:'grid', gridTemplateColumns: compact ? '1fr' : '1fr auto', gap: compact ? 6 : 10, alignItems:'stretch', flex:'1 1 auto', minHeight:0, marginBottom: compact ? 4 : 8}}>
    <div
      onTouchStart={(e) => { const t = e.touches?.[0]; if (t) touchStartRef.current = { x: t.clientX, y: t.clientY } }}
      onTouchMove={(e) => { if (compact) e.preventDefault() }}
      onTouchEnd={(e) => {
        const start = touchStartRef.current
        const t = e.changedTouches?.[0]
        if (!start || !t) return
        if (paused || showRules) {
          touchStartRef.current = null
          return
        }
        const dx = t.clientX - start.x
        const dy = t.clientY - start.y
        const absX = Math.abs(dx)
        const absY = Math.abs(dy)
        if (absX > absY) {
          const amount = absX > 120 ? 2 : 1
          if (dx > 20) move(1, amount)
          else if (dx < -20) move(-1, amount)
        } else if (dy > 70) hardDrop()
        else if (dy > 25) {
          tick()
        } else rotatePiece()
        touchStartRef.current = null
      }}
      style={{ flex:'1 1 auto', minHeight:0, display:'flex', alignItems:'center', justifyContent:'center', touchAction:'none', overflow:'hidden', opacity: paused || showRules ? 0.82 : 1 }}>
      {showRules ? <div style={{width:'100%', maxWidth: compact ? 300 : 520, maxHeight:'100%', overflow:'auto', padding: compact ? 12 : 16, borderRadius: compact ? 16 : 20, background:'linear-gradient(180deg, rgba(15,23,42,.96), rgba(2,6,23,1))', border:'1px solid rgba(255,255,255,.08)', boxSizing:'border-box'}}>
        <div style={{fontSize: compact ? 16 : 18, fontWeight:900, marginBottom:8}}>FarmStack Rules</div>
        <div style={{fontSize: compact ? 11 : 13, color:'rgba(255,255,255,.82)', lineHeight:1.45, display:'grid', gap:8}}>
          <div><strong>Goal:</strong> Fill a full row to clear it and keep stacking as long as you can.</div>
          <div><strong>Controls:</strong> Swipe left or right to move, tap to rotate, swipe down to drop.</div>
          <div><strong>🚜 Tractor:</strong> Special piece that clears one row when it lands.</div>
          <div><strong>★ Gold crate:</strong> Blasts nearby blocks around where it lands.</div>
          <div><strong>✧ Rain:</strong> Slows the game for a short time.</div>
          <div><strong>Speed:</strong> Easy, Medium, and Hard change how quickly pieces fall, with Hard ramping much more aggressively.</div>
          <div><strong>Pause:</strong> Use pause anytime, then open this rules screen if you need a reminder.</div>
        </div>
      </div> : <div style={{ width:'100%', maxWidth: compact ? 320 : 520, aspectRatio:`${COLS} / ${ROWS}`, maxHeight:'100%', padding:compact ? 0 : 10, borderRadius: compact ? 16 : 20, background: pulseBoard === 'tractor' ? 'linear-gradient(180deg, rgba(71,85,105,.98), rgba(15,23,42,1))' : pulseBoard ? 'linear-gradient(180deg, rgba(30,41,59,.95), rgba(15,23,42,1))' : 'linear-gradient(180deg, rgba(15,23,42,.92), rgba(2,6,23,1))', border: compact ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(255,255,255,.06)', boxShadow: pulseBoard === 'tractor' ? '0 0 0 3px rgba(245,158,11,.45), 0 24px 65px rgba(245,158,11,.16)' : pulseBoard ? '0 0 0 2px rgba(250,204,21,.28), 0 18px 50px rgba(14,165,233,.12)' : '0 18px 50px rgba(2,6,23,.28)', transform: pulseBoard === 'tractor' ? 'translateX(-2px) scale(1.01)' : pulseBoard ? 'scale(1.005)' : 'scale(1)', transition:'transform .12s ease, box-shadow .18s ease, background .18s ease', boxSizing:'border-box' }}>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${COLS}, 1fr)`, gap:boardGap, width:'100%', height:'100%' }}>
          {visible.flatMap((row) => row).map((cell, idx) => {
            const rowIndex = Math.floor(idx / COLS)
            const bg = cell ? palette[cell] || '#334155' : '#172033'
            const key = `${rowIndex}-${idx % COLS}`
            const flash = flashCells.includes(key)
            const settling = pieceSettledFx.includes(key)
            const dropping = pieceDropFx.includes(key)
            const rowGlow = highlightRows.includes(rowIndex)
            return <div key={idx} style={{ width:'100%', height:'100%', borderRadius:cellRadius, transform:'none', transition:'background .12s ease, opacity .12s ease, box-shadow .12s ease', background: rowGlow ? (tractorImpact ? 'rgba(251,146,60,1)' : 'rgba(245,158,11,.92)') : cell ? (palette[cell] || '#334155') : '#182133', display:'flex', alignItems:'center', justifyContent:'center', color:'transparent', fontWeight:900, fontSize: compact ? 10 : 15, border:'1px solid rgba(255,255,255,.06)', boxShadow: rowGlow && tractorImpact ? '0 0 18px rgba(251,146,60,.55), inset 0 0 0 1px rgba(255,255,255,.14)' : 'none', filter:'none', opacity:1, overflow:'hidden', position:'relative' }}><span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color: cell || rowGlow ? 'rgba(255,255,255,.72)' : 'transparent', textShadow: cell || rowGlow ? '0 1px 2px rgba(0,0,0,.22)' : 'none', fontWeight:900, fontSize: compact ? 10 : 15, lineHeight:1, pointerEvents:'none' }}>{cell ? (icons[cell] || '') : rowGlow ? '🚜' : ''}</span></div>
          })}
        </div>
      </div>}
      {!!scorePop && <div style={{ position:'absolute', top: compact ? 52 : 60, left:'50%', transform:'translateX(-50%)', padding: compact ? '4px 10px' : '6px 14px', borderRadius:999, background:'rgba(245,158,11,.95)', color:'#fff', fontWeight:1000, fontSize: compact ? 12 : 16, letterSpacing:'.04em', boxShadow:'0 10px 24px rgba(245,158,11,.35)', pointerEvents:'none', zIndex:18 }}>🚜 {scorePop}</div>}
    </div>
    {!compact && !showRules && <div style={{width:124, flex:'0 0 124px', display:'grid', alignContent:'start', gap:10}}><div style={{padding:'12px 10px', borderRadius:20, background:'linear-gradient(180deg, rgba(15,23,42,.92), rgba(2,6,23,1))', border:'1px solid rgba(255,255,255,.08)', boxShadow:'0 18px 40px rgba(2,6,23,.24)'}}><div style={{fontSize:11, fontWeight:900, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.68)', marginBottom:10}}>Next</div><div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6}}>{nextPreviewGrid.flatMap((row) => row).map((cell, idx) => { const bg = cell ? palette[cell] || '#334155' : '#172033'; return <div key={`preview-${idx}`} style={{aspectRatio:'1 / 1', borderRadius:10, background:cell ? `radial-gradient(circle at 30% 25%, rgba(255,255,255,.34), transparent 28%), linear-gradient(180deg, ${bg}, ${bg}dd)` : 'linear-gradient(180deg, #182133, #0f172a)', border:cell ? '1px solid rgba(255,255,255,.18)' : '1px solid rgba(255,255,255,.04)', boxShadow:cell ? `0 8px 18px ${bg}33, inset 0 1px 0 rgba(255,255,255,.14)` : 'inset 0 1px 0 rgba(255,255,255,.03)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900}}>{cell ? (icons[cell] || cell) : ''}</div> })}</div></div></div>}
    </div>
    {(paused || showRules) && <div style={{marginTop:2, marginBottom:2, color:'#fde68a', fontSize:10, fontWeight:800, textAlign:'center', flex:'0 0 auto'}}>{showRules ? 'Rules open' : 'Paused'}</div>}
    {compact ? <div style={{ marginTop:2, minHeight:12, color:'#fef3c7', fontSize:9, fontWeight:700, textAlign:'center', flex:'0 0 auto', lineHeight:1.2 }}>{showRules ? 'Read the rules, then tap Back to Pause.' : paused ? 'Paused. Tap Resume to continue.' : rewardText || 'Swipe to move, harder swipe to shift farther, tap to rotate, swipe down to drop.'}</div> : <>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:6, flex:'0 0 auto' }}>
      <button type='button' className='btn' style={controlButtonStyle} onClick={() => move(-1)} disabled={gameOver || paused || showRules}>← Move</button>
      <button type='button' className='btn' style={controlButtonStyle} onClick={rotatePiece} disabled={gameOver || paused || showRules}>Rotate</button>
      <button type='button' className='btn' style={controlButtonStyle} onClick={() => move(1)} disabled={gameOver || paused || showRules}>Move →</button>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, flex:'0 0 auto' }}>
      <button type='button' className='btn btn-dark' style={controlButtonStyle} onClick={hardDrop} disabled={gameOver || paused || showRules}>Drop</button>
      <button type='button' className='btn' style={controlButtonStyle} onClick={reset}>Restart</button>
    </div>
    <div style={{ marginTop:4, minHeight:16, color:'#fef3c7', fontSize:10, fontWeight:700, textAlign:'center', flex:'0 0 auto' }}>{showRules ? 'Review the rules, then return to pause.' : paused ? 'Paused. Resume when ready.' : rewardText || 'Keep stacking. Build combos for bigger rewards.'}</div>
    </>}
    {gameOver && <div style={{position:'absolute', inset:0, zIndex:20, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(2,6,23,.62)', WebkitBackdropFilter:'blur(4px)', backdropFilter:'blur(4px)', pointerEvents:'auto'}}><div style={{display:'grid', gap:10, justifyItems:'center', textAlign:'center', padding:'20px 18px', borderRadius:22, background:'linear-gradient(180deg, rgba(15,23,42,.96), rgba(2,6,23,.98))', border:'1px solid rgba(255,255,255,.08)', boxShadow:'0 24px 60px rgba(2,6,23,.45)', maxWidth:'min(280px, 88vw)'}}><div style={{fontSize: compact ? 26 : 34, fontWeight:1000, color:'#fff', letterSpacing:'-.03em'}}>GAME OVER</div><div style={{fontSize: compact ? 11 : 13, color:'rgba(255,255,255,.76)'}}>Score {score} • Rows {rowsCleared} • Time {timerLabel}</div><button type='button' className='btn btn-dark' style={{padding: compact ? '8px 14px' : '10px 18px', fontSize: compact ? 12 : 14}} onClick={reset}>Restart</button></div></div>}
  </div>
}
