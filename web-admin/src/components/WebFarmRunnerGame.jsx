import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../services/api'

const LANES = [0, 1, 2]
const VISIBLE_ROWS = 8
const TICK_MS = 220
const RUNNER_SPEED_PRESETS = {
  slow: { label: 'Slow', tick: 430 },
  medium: { label: 'Medium', tick: 350 },
  fast: { label: 'Fast', tick: 285 },
}
const RUNNER_EMOJIS = {
  farmer: '🧑🏾‍🌾',
  rider: '🏍️',
  chicken: '🐔',
  goat: '🐐',
}
const collectibleDefs = [
  { type: 'egg', icon: '🥚', points: 16, credits: 0, weight: 5 },
  { type: 'maize', icon: '🌽', points: 22, credits: 0, weight: 5 },
  { type: 'farmcredits', icon: '⭐', points: 40, credits: 1, weight: 2 },
]
const obstacleDefs = [
  { type: 'fence', icon: '🚧', laneBlock: true, weight: 4 },
  { type: 'truck', icon: '🚚', laneBlock: true, weight: 4 },
  { type: 'hole', icon: '🕳️', laneBlock: true, weight: 3 },
]
const powerDefs = [
  { type: 'magnet', icon: '🧲', label: 'Magnet pickup', weight: 2 },
  { type: 'shield', icon: '🛡️', label: 'Shield', weight: 2 },
]

const weightedPick = (items) => {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let roll = Math.random() * total
  for (const item of items) {
    roll -= item.weight
    if (roll <= 0) return item
  }
  return items[items.length - 1]
}

const makeInitialRows = () => Array.from({ length: VISIBLE_ROWS }, (_, idx) => {
  if (idx < VISIBLE_ROWS - 2) return [null, null, null]
  return [null, null, null]
})

const makeSpawnRow = (distance, previousRow = [null, null, null]) => {
  const row = [null, null, null]
  const safeLane = LANES[Math.floor(Math.random() * LANES.length)]
  const obstacleCap = distance < 2200 ? 1 : 2
  const obstacleChance = distance < 900 ? 0.16 : distance < 2200 ? 0.26 : distance < 3600 ? 0.38 : 0.48
  let obstacleCount = 0

  LANES.forEach((lane) => {
    if (lane === safeLane) return
    const previousCell = previousRow[lane]
    const previousWasObstacle = previousCell?.kind === 'obstacle'
    const canPlaceObstacle = obstacleCount < obstacleCap && !previousWasObstacle

    if (canPlaceObstacle && Math.random() < obstacleChance) {
      const obstacle = weightedPick(obstacleDefs)
      row[lane] = { kind: 'obstacle', ...obstacle }
      obstacleCount += 1
      return
    }

    if (Math.random() < 0.16) {
      const power = weightedPick(powerDefs)
      row[lane] = { kind: 'power', ...power }
      return
    }

    if (Math.random() < 0.45) {
      const collectible = weightedPick(collectibleDefs)
      row[lane] = { kind: 'collectible', ...collectible }
    }
  })

  if (Math.random() < 0.72) {
    const safeLaneReward = Math.random() < 0.16 ? { kind: 'power', ...weightedPick(powerDefs) } : { kind: 'collectible', ...weightedPick(collectibleDefs) }
    row[safeLane] = safeLaneReward
  }

  return row
}

export default function WebFarmRunnerGame({ onFinish, compact = false, storageKey = 'farmsavior_farm_runner_guest' }) {
  const [runner, setRunner] = useState('farmer')
  const [lane, setLane] = useState(1)
  const [rows, setRows] = useState(makeInitialRows)
  const [distance, setDistance] = useState(0)
  const [producePoints, setProducePoints] = useState(0)
  const [coins, setCoins] = useState(0)
  const [farmCredits, setFarmCredits] = useState(0)
  const [best, setBest] = useState(0)
  const [statusText, setStatusText] = useState('Swipe to run the farm roads.')
  const [streak, setStreak] = useState(0)
  const [speedMode, setSpeedMode] = useState('medium')
  const [soundOn, setSoundOn] = useState(false)
  const [paused, setPaused] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [laneFlash, setLaneFlash] = useState(0)
  const [shieldTicks, setShieldTicks] = useState(0)
  const [magnetTicks, setMagnetTicks] = useState(0)
  const [doubleTicks, setDoubleTicks] = useState(0)
  const [tickMs, setTickMs] = useState(TICK_MS)
  const [syncState, setSyncState] = useState('Synced')
  const touchStartRef = useRef(null)
  const audioContextRef = useRef(null)
  const laneRef = useRef(lane)
  const rowsRef = useRef(rows)
  const distanceRef = useRef(distance)
  const laneFlashTimerRef = useRef(null)

  useEffect(() => { laneRef.current = lane }, [lane])
  useEffect(() => { rowsRef.current = rows }, [rows])
  useEffect(() => { distanceRef.current = distance }, [distance])

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
        const response = await api.fetchGameState({ game_code: 'farmrunner' })
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
    setSyncState('Saving…')
    api.saveGameState({ game_code: 'farmrunner', state_json: payload }).then(() => setSyncState('Synced')).catch(() => setSyncState('Saved on this device'))
  }, [storageKey, best, speedMode, soundOn])

  useEffect(() => {
    const baseTick = RUNNER_SPEED_PRESETS[speedMode]?.tick ?? TICK_MS
    const speedUp = Math.min(42, Math.floor(distance / 1300))
    setTickMs(Math.max(230, baseTick - speedUp))
  }, [distance, speedMode])

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
        tap: { freq: 410, dur: 0.05, vol: 0.016, type: 'triangle' },
        move: { freq: 290, dur: 0.05, vol: 0.016, type: 'square' },
        collect: { freq: 640, dur: 0.09, vol: 0.028, type: 'triangle' },
        power: { freq: 780, dur: 0.12, vol: 0.03, type: 'sine' },
        hit: { freq: 190, dur: 0.18, vol: 0.03, type: 'sawtooth' },
      }
      const tone = tones[type] || tones.tap
      osc.type = tone.type
      osc.frequency.setValueAtTime(tone.freq, now)
      if (type === 'collect' || type === 'power') osc.frequency.exponentialRampToValueAtTime(tone.freq * 1.15, now + tone.dur)
      if (type === 'hit') osc.frequency.exponentialRampToValueAtTime(120, now + tone.dur)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(tone.vol, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + tone.dur)
    } catch {}
  }

  const flashRunnerLane = () => {
    setLaneFlash(1)
    if (laneFlashTimerRef.current) clearTimeout(laneFlashTimerRef.current)
    laneFlashTimerRef.current = setTimeout(() => setLaneFlash(0), 140)
  }

  const reset = () => {
    setLane(1)
    setRows(makeInitialRows())
    setDistance(0)
    setProducePoints(0)
    setCoins(0)
    setFarmCredits(0)
    setStatusText('Swipe to run the farm roads.')
    setStreak(0)
    setPaused(false)
    setShowRules(false)
    setGameOver(false)
    setLaneFlash(0)
    setShieldTicks(0)
    setMagnetTicks(0)
    setDoubleTicks(0)
    setTickMs(RUNNER_SPEED_PRESETS[speedMode]?.tick ?? TICK_MS)
  }

  const finishRun = (summary) => {
    const totalScore = summary.distance + summary.producePoints + (summary.coins * 4) + (summary.farmCredits * 60)
    setBest((prev) => Math.max(prev, totalScore))
    onFinish?.({
      score: totalScore,
      distance: summary.distance,
      producePoints: summary.producePoints,
      farmCredits: summary.farmCredits,
      coins: summary.coins,
      rewardText: `Distance ${summary.distance}m, produce ${summary.producePoints}, credits ${summary.farmCredits}.`,
    })
  }

  const step = () => {
    if (paused || showRules || gameOver) return
    const currentRows = rowsRef.current
    const bottomRow = currentRows[currentRows.length - 1] || [null, null, null]
    const currentLane = laneRef.current
    const hit = bottomRow[currentLane]

    let nextDistance = distanceRef.current + 20
    let nextProduce = producePoints
    let nextCoins = coins
    let nextFarmCredits = farmCredits
    let nextShield = shieldTicks
    let nextMagnet = magnetTicks
    let nextDouble = doubleTicks
    let nextStatus = ''
    let endRun = false
    let nextStreak = streak + 1

    const multiplier = nextDouble > 0 ? 2 : 1

    if (hit?.kind === 'collectible') {
      nextProduce += hit.points * multiplier
      nextFarmCredits += hit.credits * multiplier
      if (hit.type === 'coins') nextCoins += 1 * multiplier
      nextStatus = `Collected ${hit.type}.`
      playSound('collect')
    }

    if (hit?.kind === 'power') {
      if (hit.type === 'magnet') {
        nextMagnet = 28
        nextStatus = 'Magnet active.'
        playSound('power')
      }
      if (hit.type === 'boots') {
        nextDistance += 35
        nextStatus = 'Speed boots boost.'
      }
      if (hit.type === 'shield') {
        nextShield = 26
        nextStatus = 'Shield active.'
        playSound('power')
      }
      if (hit.type === 'double') {
        nextDouble = 30
        nextStatus = 'Double rewards active.'
      }
    }

    if (hit?.kind === 'obstacle') {
      nextStreak = 0
      if (nextShield > 0) {
        nextShield = Math.max(0, nextShield - 10)
        nextStatus = 'Shield blocked the obstacle.'
        playSound('power')
      } else {
        endRun = true
        nextStatus = `Hit a ${hit.type}.`
        playSound('hit')
      }
    }

    const shifted = currentRows.slice(0, currentRows.length - 1)
    const nextRow = makeSpawnRow(nextDistance, currentRows[0])

    if (nextMagnet > 0) {
      const magnetRow = shifted[shifted.length - 1]
      if (magnetRow) {
        LANES.forEach((laneIndex) => {
          const item = magnetRow[laneIndex]
          if (item?.kind === 'collectible') {
            nextProduce += item.points * multiplier
            nextFarmCredits += item.credits * multiplier
            if (item.type === 'coins') nextCoins += 1 * multiplier
            magnetRow[laneIndex] = null
          }
        })
        if (!nextStatus) nextStatus = 'Magnet pulled nearby produce.'
      }
    }

    const updatedRows = [nextRow, ...shifted]
    setRows(updatedRows)
    rowsRef.current = updatedRows
    setDistance(nextDistance)
    distanceRef.current = nextDistance
    setProducePoints(nextProduce)
    setCoins(nextCoins)
    setFarmCredits(nextFarmCredits)
    setShieldTicks(Math.max(0, nextShield - 1))
    setMagnetTicks(Math.max(0, nextMagnet - 1))
    setDoubleTicks(Math.max(0, nextDouble - 1))
    setStreak(nextStreak)
    if (nextDistance % 500 === 0) nextStatus = `Milestone hit: ${nextDistance}m.`
    else if (nextStreak > 0 && nextStreak % 20 === 0) nextStatus = 'Clean run streak. Keep it going.'
    if (nextStatus) setStatusText(nextStatus)

    if (endRun) {
      setGameOver(true)
      finishRun({ distance: nextDistance, producePoints: nextProduce, farmCredits: nextFarmCredits, coins: nextCoins })
    }
  }

  useEffect(() => {
    if (paused || showRules || gameOver) return undefined
    const timer = setInterval(step, tickMs)
    return () => clearInterval(timer)
  }, [paused, showRules, gameOver, tickMs, producePoints, coins, farmCredits, shieldTicks, magnetTicks, doubleTicks])

  useEffect(() => () => {
    if (laneFlashTimerRef.current) clearTimeout(laneFlashTimerRef.current)
  }, [])

  useEffect(() => {
    if (gameOver) setSyncState('Synced')
  }, [gameOver])

  const moveLane = (dir, amount = 1) => {
    setLane((prev) => {
      const next = Math.max(0, Math.min(2, prev + (dir * amount)))
      laneRef.current = next
      return next
    })
    playSound('move')
    flashRunnerLane()
    setStatusText(dir < 0 ? `Moved ${amount > 1 ? 'hard ' : ''}left.` : `Moved ${amount > 1 ? 'hard ' : ''}right.`)
  }
  const jump = () => {
    playSound('tap')
    flashRunnerLane()
    setStatusText('Jumped over the road.')
  }
  const slide = (boosted = false) => {
    playSound(boosted ? 'power' : 'tap')
    flashRunnerLane()
    setStatusText(boosted ? 'Hard slide.' : 'Slid low and kept running.')
  }

  const visibleRows = useMemo(() => rows.map((row, rowIndex) => row.map((cell, laneIndex) => ({ cell, rowIndex, laneIndex }))), [rows])

  return <div style={{height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0, position:'relative'}}>
    <div style={{display:'grid', gridTemplateColumns: compact ? 'repeat(5, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))', gap: compact ? 3 : 6, marginBottom: compact ? 4 : 8, color:'#fff', flex:'0 0 auto'}}>
      <div style={{padding:'6px 8px', borderRadius:12, background:'rgba(255,255,255,.06)'}}><div style={{fontSize:8, opacity:.72}}>Distance</div><div style={{fontWeight:900, fontSize:compact ? '.85rem' : '1.2rem'}}>{distance}m</div></div>
      <div style={{padding:'6px 8px', borderRadius:12, background:'rgba(255,255,255,.06)'}}><div style={{fontSize:8, opacity:.72}}>Produce</div><div style={{fontWeight:900, fontSize:compact ? '.85rem' : '1.2rem'}}>{producePoints}</div></div>
      <div style={{padding:'6px 8px', borderRadius:12, background:'rgba(255,255,255,.06)'}}><div style={{fontSize:8, opacity:.72}}>Credits</div><div style={{fontWeight:900, fontSize:compact ? '.85rem' : '1.2rem'}}>{farmCredits}</div></div>
      <div style={{padding:'6px 8px', borderRadius:12, background:'rgba(255,255,255,.06)'}}><div style={{fontSize:8, opacity:.72}}>Streak</div><div style={{fontWeight:900, fontSize:compact ? '.85rem' : '1.2rem'}}>{streak}</div></div>
      <div style={{padding:'6px 8px', borderRadius:12, background:'rgba(255,255,255,.06)'}}><div style={{fontSize:8, opacity:.72}}>Best</div><div style={{fontWeight:900, fontSize:compact ? '.85rem' : '1.2rem'}}>{best}</div></div>
    </div>

    <div style={{display:'flex', gap:6, marginBottom: compact ? 4 : 8, flexWrap:'wrap', flex:'0 0 auto'}}>
      <select className='input' value={runner} onChange={(e) => setRunner(e.target.value)} style={{minWidth: compact ? 128 : 180, fontSize: compact ? 11 : 14}}>
        <option value='farmer'>Farmer</option>
        <option value='rider'>Delivery rider</option>
        <option value='chicken'>Chicken mascot</option>
        <option value='goat'>Goat mascot</option>
      </select>
      <select className='input' value={speedMode} onChange={(e) => { const mode = e.target.value; setSpeedMode(mode); setTickMs(RUNNER_SPEED_PRESETS[mode]?.tick ?? TICK_MS) }} style={{minWidth: compact ? 112 : 160, fontSize: compact ? 11 : 14}}>
        {Object.entries(RUNNER_SPEED_PRESETS).map(([key, preset]) => <option key={key} value={key}>{preset.label}</option>)}
      </select>
      <button type='button' className='btn' onClick={() => { setShowRules(false); setPaused((prev) => !prev) }}>{paused ? 'Resume' : 'Pause'}</button>
      <button type='button' className='btn' onClick={() => setSoundOn((prev) => !prev)}>{soundOn ? 'Sound On' : 'Sound Off'}</button>
      {(paused || showRules) && <button type='button' className='btn btn-dark' onClick={() => { setPaused(true); setShowRules((prev) => !prev) }}>{showRules ? 'Back to Pause' : 'Hint / Rules'}</button>}
      {paused && !showRules && <button type='button' className='btn' onClick={reset}>Restart</button>}
      <div style={{padding:'8px 10px', borderRadius:999, background:'rgba(255,255,255,.08)', fontSize:12, fontWeight:800}}>{syncState}</div>
    </div>

    <div
      onTouchStart={(e) => { const t = e.touches?.[0]; if (t) touchStartRef.current = { x: t.clientX, y: t.clientY } }}
      onTouchMove={(e) => { if (compact) e.preventDefault() }}
      onTouchEnd={(e) => {
        const start = touchStartRef.current
        const t = e.changedTouches?.[0]
        if (!start || !t) return
        if (paused || showRules || gameOver) {
          touchStartRef.current = null
          return
        }
        const dx = t.clientX - start.x
        const dy = t.clientY - start.y
        const absX = Math.abs(dx)
        const absY = Math.abs(dy)
        if (absX > absY) {
          const amount = absX > 140 ? 2 : 1
          if (dx > 18) moveLane(1, amount)
          else if (dx < -18) moveLane(-1, amount)
        } else if (dy < -18) jump()
        else if (dy > 18) slide(absY > 110)
        touchStartRef.current = null
      }}
      style={{flex:'1 1 auto', minHeight:0, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', marginBottom: compact ? 4 : 8, touchAction:'none'}}>
      {showRules ? <div style={{width:'100%', maxWidth: compact ? 320 : 520, maxHeight:'100%', overflow:'auto', padding: compact ? 12 : 16, borderRadius:18, background:'linear-gradient(180deg, rgba(15,23,42,.96), rgba(2,6,23,1))', color:'#fff'}}>
        <div style={{fontSize: compact ? 16 : 20, fontWeight:900, marginBottom:8}}>Farm Runner Rules</div>
        <div style={{display:'grid', gap:8, fontSize: compact ? 11 : 13, lineHeight:1.45}}>
          <div><strong>Objective:</strong> Run through farm roads, collect produce, and avoid obstacles.</div>
          <div><strong>Controls:</strong> Swipe left or right to change lanes, swipe up to jump, swipe down to slide.</div>
          <div><strong>Collect:</strong> 🥚 Eggs, 🌽 maize, and ⭐ FarmCredits stars.</div>
          <div><strong>Avoid:</strong> 🚧 fences, 🚚 trucks, and 🕳️ holes.</div>
          <div><strong>Power-ups:</strong> 🧲 magnet pickup and 🛡️ shield.</div>
          <div><strong>Progression:</strong> Choose Slow, Medium, or Fast, then the road gradually speeds up as distance rises. The opening stretch is easier so players can settle in first, and each new row keeps at least one fair escape lane.</div>
        </div>
      </div> : <div style={{width:'100%', maxWidth: compact ? 320 : 520, height:'100%', minHeight:0, borderRadius:20, overflow:'hidden', background:'linear-gradient(180deg, #2563eb 0%, #0f172a 40%, #14532d 100%)', border:'1px solid rgba(255,255,255,.08)', position:'relative'}}>
        <div style={{position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(255,255,255,.1), transparent 22%)'}} />
        <div style={{position:'absolute', left:'8%', right:'8%', top:'11%', height: compact ? 18 : 22, borderRadius:999, background:'linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02))', boxShadow:'inset 0 1px 0 rgba(255,255,255,.08)'}} />
        <div style={{position:'absolute', inset:'14% 0 0 0', display:'grid', gridTemplateRows:`repeat(${VISIBLE_ROWS}, 1fr)`, gap:4, padding:'0 14px 14px'}}>
          {visibleRows.map((row, rowIndex) => <div key={`runner-row-${rowIndex}`} style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6}}>
            {row.map(({ cell, laneIndex }) => {
              const isPlayerRow = rowIndex === VISIBLE_ROWS - 1
              const isPlayerLane = isPlayerRow && laneIndex === lane
              const laneGlow = isPlayerLane && laneFlash ? '0 0 0 2px rgba(255,255,255,.18), 0 0 26px rgba(250,204,21,.42)' : isPlayerLane ? '0 0 18px rgba(250,204,21,.28)' : 'none'
              return <div key={`runner-cell-${rowIndex}-${laneIndex}`} style={{borderRadius:16, minHeight:0, background: isPlayerRow ? 'rgba(120,53,15,.42)' : rowIndex % 2 === 0 ? 'rgba(255,255,255,.075)' : 'rgba(255,255,255,.05)', border: isPlayerLane ? '2px solid rgba(250,204,21,.95)' : cell?.kind === 'obstacle' ? '1px solid rgba(248,113,113,.22)' : cell?.kind === 'collectible' ? '1px solid rgba(74,222,128,.22)' : '1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: isPlayerLane ? (compact ? 18 : 22) : (compact ? 16 : 20), boxShadow: laneGlow, transform: cell?.kind === 'collectible' ? 'scale(1.02)' : 'scale(1)', transition:'transform .14s ease, box-shadow .14s ease, border-color .14s ease'}}>{isPlayerLane ? RUNNER_EMOJIS[runner] : cell ? cell.icon : ''}</div>
            })}
          </div>)}
        </div>
      </div>}
    </div>

    <div style={{display:'grid', gap:4, flex:'0 0 auto'}}>
      {(paused || showRules) && <div style={{color:'#fde68a', fontSize:10, fontWeight:800, textAlign:'center'}}>{showRules ? 'Rules open' : 'Paused'}</div>}
      <div style={{color:'#fef3c7', fontSize: compact ? 9 : 11, fontWeight:700, textAlign:'center', minHeight:12}}>{showRules ? 'Read the rules, then tap Back to Pause.' : gameOver ? '' : statusText}</div>
      {!compact && <div style={{color:'rgba(255,255,255,.75)', fontSize:12, textAlign:'center'}}>Swipe lanes, jump, and slide. Distance becomes FarmCredits, produce becomes points.</div>}
    </div>
    {gameOver && <div style={{position:'absolute', inset:0, zIndex:20, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(2,6,23,.6)', WebkitBackdropFilter:'blur(4px)', backdropFilter:'blur(4px)'}}><div style={{display:'grid', gap:10, justifyItems:'center', textAlign:'center', padding:'20px 18px', borderRadius:22, background:'linear-gradient(180deg, rgba(15,23,42,.96), rgba(2,6,23,.98))', border:'1px solid rgba(255,255,255,.08)', boxShadow:'0 24px 60px rgba(2,6,23,.45)', maxWidth:'min(280px, 88vw)'}}><div style={{fontSize: compact ? 26 : 34, fontWeight:1000, color:'#fff', letterSpacing:'-.03em'}}>GAME OVER</div><div style={{fontSize: compact ? 11 : 13, color:'rgba(255,255,255,.76)'}}>Distance {distance}m • Produce {producePoints} • Credits {farmCredits}</div><button type='button' className='btn btn-dark' style={{padding: compact ? '8px 14px' : '10px 18px', fontSize: compact ? 12 : 14}} onClick={reset}>Restart</button></div></div>}
  </div>
}
