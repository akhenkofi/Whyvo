import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../services/api'

const GOODS = [
  { key: 'maize', label: 'Maize', icon: '🌽', basePrice: 24 },
  { key: 'eggs', label: 'Eggs', icon: '🥚', basePrice: 18 },
  { key: 'milk', label: 'Milk', icon: '🥛', basePrice: 28 },
  { key: 'tomatoes', label: 'Tomatoes', icon: '🍅', basePrice: 22 },
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const currency = (n) => `${Math.round(n)}`

const EVENTS = [
  { key: 'boom', label: 'Export boom', text: 'Export boom. Buyers are paying premium prices.', priceMult: 1.28, bankBonus: 1 },
  { key: 'crash', label: 'Market crash', text: 'Market crash. Prices dipped hard, bargain hunters win.', priceMult: 0.72, bankBonus: 0 },
  { key: 'rain', label: 'Good rains', text: 'Good rains boosted supply and cooled produce prices.', target: ['maize', 'tomatoes'], priceMult: 0.76, bankBonus: 0 },
  { key: 'shortage', label: 'Supply shortage', text: 'Supply shortage. Eggs and milk are surging.', target: ['eggs', 'milk'], priceMult: 1.34, bankBonus: 1 },
  { key: 'festival', label: 'Festival demand', text: 'Festival demand is pushing food prices up fast.', priceMult: 1.18, bankBonus: 1 },
]

const makeMarket = (round = 1, event = null, upgrades = 0) => GOODS.map((good, index) => {
  const swing = 0.68 + Math.random() * 0.96 + (round * 0.018)
  let price = Math.max(7, Math.round(good.basePrice * swing + index))
  if (event?.priceMult) {
    const applies = !event.target || event.target.includes(good.key)
    if (applies) price = Math.max(7, Math.round(price * event.priceMult))
  }
  if (upgrades > 0 && price < good.basePrice) price = Math.max(7, Math.round(price * (1 - Math.min(0.12, upgrades * 0.03))))
  return {
    ...good,
    price,
  }
})

export default function WebTradeTycoonGame({ compact = false, storageKey = 'farmsavior_trade_tycoon_guest' }) {
  const [round, setRound] = useState(1)
  const [cash, setCash] = useState(140)
  const [bankedCredits, setBankedCredits] = useState(0)
  const [inventory, setInventory] = useState({ maize: 0, eggs: 0, milk: 0, tomatoes: 0 })
  const [market, setMarket] = useState(() => makeMarket(1))
  const [selectedGood, setSelectedGood] = useState('maize')
  const [statusText, setStatusText] = useState('Buy low, sell high, and grow your farm trading empire.')
  const [bestWorth, setBestWorth] = useState(140)
  const [hotStreak, setHotStreak] = useState(0)
  const [eventText, setEventText] = useState('Quiet market. Look for the next big swing.')
  const [upgradeLevel, setUpgradeLevel] = useState(0)
  const [profitPulse, setProfitPulse] = useState(0)
  const [eventTitle, setEventTitle] = useState('Market Watch')
  const [lastSaleText, setLastSaleText] = useState('No sale yet. Hunt for your first big flip.')
  const [syncState, setSyncState] = useState('Synced')
  const [soundOn, setSoundOn] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [highlight, setHighlight] = useState('')
  const audioContextRef = useRef(null)
  const highlightTimerRef = useRef(null)

  useEffect(() => {
    if (!compact || typeof document === 'undefined') return undefined
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [compact])

  useEffect(() => {
    let cancelled = false
    const loadState = async () => {
      if (!storageKey) return
      try {
        const response = await api.fetchGameState({ game_code: 'tradetycoon' })
        const raw = response?.state_json
        if (!raw) return
        const saved = JSON.parse(raw)
        if (cancelled || !saved || typeof saved !== 'object') return
        if (Number.isFinite(saved.round)) setRound(saved.round)
        if (Number.isFinite(saved.cash)) setCash(saved.cash)
        if (Number.isFinite(saved.bankedCredits)) setBankedCredits(saved.bankedCredits)
        if (saved.inventory && typeof saved.inventory === 'object') setInventory({ maize: 0, eggs: 0, milk: 0, tomatoes: 0, ...saved.inventory })
        if (Array.isArray(saved.market) && saved.market.length) setMarket(saved.market)
        if (typeof saved.selectedGood === 'string') setSelectedGood(saved.selectedGood)
        if (typeof saved.statusText === 'string') setStatusText(saved.statusText)
        if (Number.isFinite(saved.bestWorth)) setBestWorth(saved.bestWorth)
        if (Number.isFinite(saved.hotStreak)) setHotStreak(saved.hotStreak)
        if (typeof saved.eventText === 'string') setEventText(saved.eventText)
        if (typeof saved.eventTitle === 'string') setEventTitle(saved.eventTitle)
        if (typeof saved.lastSaleText === 'string') setLastSaleText(saved.lastSaleText)
        if (Number.isFinite(saved.upgradeLevel)) setUpgradeLevel(saved.upgradeLevel)
        if (typeof saved.gameOver === 'boolean') setGameOver(saved.gameOver)
      } catch {
        try {
          const raw = localStorage.getItem(storageKey)
          if (!raw) return
          const saved = JSON.parse(raw)
          if (!saved || typeof saved !== 'object') return
          if (Number.isFinite(saved.round)) setRound(saved.round)
          if (Number.isFinite(saved.cash)) setCash(saved.cash)
          if (Number.isFinite(saved.bankedCredits)) setBankedCredits(saved.bankedCredits)
          if (saved.inventory && typeof saved.inventory === 'object') setInventory({ maize: 0, eggs: 0, milk: 0, tomatoes: 0, ...saved.inventory })
          if (Array.isArray(saved.market) && saved.market.length) setMarket(saved.market)
          if (typeof saved.selectedGood === 'string') setSelectedGood(saved.selectedGood)
          if (typeof saved.statusText === 'string') setStatusText(saved.statusText)
          if (Number.isFinite(saved.bestWorth)) setBestWorth(saved.bestWorth)
          if (Number.isFinite(saved.hotStreak)) setHotStreak(saved.hotStreak)
          if (typeof saved.eventText === 'string') setEventText(saved.eventText)
          if (typeof saved.eventTitle === 'string') setEventTitle(saved.eventTitle)
          if (typeof saved.lastSaleText === 'string') setLastSaleText(saved.lastSaleText)
          if (Number.isFinite(saved.upgradeLevel)) setUpgradeLevel(saved.upgradeLevel)
          if (typeof saved.gameOver === 'boolean') setGameOver(saved.gameOver)
        } catch {}
      }
    }
    loadState()
    return () => { cancelled = true }
  }, [storageKey])

  useEffect(() => {
    if (!storageKey) return
    const payload = JSON.stringify({
      round,
      cash,
      bankedCredits,
      inventory,
      market,
      selectedGood,
      statusText,
      bestWorth,
      hotStreak,
      eventText,
      eventTitle,
      lastSaleText,
      upgradeLevel,
      gameOver,
    })
    try { localStorage.setItem(storageKey, payload) } catch {}
    setSyncState('Saving…')
    api.saveGameState({ game_code: 'tradetycoon', state_json: payload }).then(() => setSyncState('Synced')).catch(() => setSyncState('Saved on this device'))
  }, [storageKey, round, cash, bankedCredits, inventory, market, selectedGood, statusText, bestWorth, hotStreak, eventText, eventTitle, lastSaleText, upgradeLevel, gameOver])

  const netWorth = useMemo(() => {
    const stockValue = market.reduce((sum, item) => sum + ((inventory[item.key] || 0) * item.price), 0)
    return cash + stockValue + (bankedCredits * 20)
  }, [cash, inventory, market, bankedCredits])

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
        tap: { freq: 420, dur: 0.05, vol: 0.014, type: 'triangle' },
        buy: { freq: 520, dur: 0.08, vol: 0.022, type: 'sine' },
        sell: { freq: 690, dur: 0.11, vol: 0.026, type: 'triangle' },
        advance: { freq: 760, dur: 0.12, vol: 0.024, type: 'square' },
        danger: { freq: 190, dur: 0.18, vol: 0.028, type: 'sawtooth' },
      }
      const tone = tones[type] || tones.tap
      osc.type = tone.type
      osc.frequency.setValueAtTime(tone.freq, now)
      if (type === 'sell' || type === 'advance') osc.frequency.exponentialRampToValueAtTime(tone.freq * 1.12, now + tone.dur)
      if (type === 'danger') osc.frequency.exponentialRampToValueAtTime(120, now + tone.dur)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(tone.vol, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + tone.dur)
    } catch {}
  }

  const flash = (key) => {
    setHighlight(key)
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    highlightTimerRef.current = setTimeout(() => setHighlight(''), 180)
  }

  const reset = () => {
    setRound(1)
    setCash(140)
    setBankedCredits(0)
    setInventory({ maize: 0, eggs: 0, milk: 0, tomatoes: 0 })
    setMarket(makeMarket(1))
    setSelectedGood('maize')
    setStatusText('Buy low, sell high, and grow your farm trading empire.')
    setBestWorth(140)
    setHotStreak(0)
    setEventText('Quiet market. Look for the next big swing.')
    setEventTitle('Market Watch')
    setLastSaleText('No sale yet. Hunt for your first big flip.')
    setUpgradeLevel(0)
    setProfitPulse(0)
    setShowRules(false)
    setGameOver(false)
    setHighlight('')
    try { if (storageKey && typeof window !== 'undefined') localStorage.removeItem(storageKey) } catch {}
    api.saveGameState({ game_code: 'tradetycoon', state_json: JSON.stringify({ round: 1, cash: 140, bankedCredits: 0, inventory: { maize: 0, eggs: 0, milk: 0, tomatoes: 0 }, market: makeMarket(1), selectedGood: 'maize', statusText: 'Buy low, sell high, and grow your farm trading empire.', bestWorth: 140, hotStreak: 0, eventText: 'Quiet market. Look for the next big swing.', eventTitle: 'Market Watch', lastSaleText: 'No sale yet. Hunt for your first big flip.', upgradeLevel: 0, gameOver: false }) }).catch(() => {})
  }

  const currentGood = market.find((item) => item.key === selectedGood) || market[0]

  const buyOne = () => {
    if (gameOver || !currentGood) return
    if (cash < currentGood.price) {
      setStatusText(`Not enough cash for ${currentGood.label}.`)
      playSound('danger')
      flash('cash')
      return
    }
    setCash((prev) => prev - currentGood.price)
    setInventory((prev) => ({ ...prev, [currentGood.key]: (prev[currentGood.key] || 0) + 1 }))
    setHotStreak(0)
    setStatusText(currentGood.price <= currentGood.basePrice * 0.9 ? `Nice deal, ${currentGood.label} is cheap right now.` : `Bought 1 ${currentGood.label}.`) 
    playSound('buy')
    flash(currentGood.key)
  }

  const sellOne = () => {
    if (gameOver || !currentGood) return
    if ((inventory[currentGood.key] || 0) <= 0) {
      setStatusText(`No ${currentGood.label} in stock.`)
      playSound('danger')
      flash(currentGood.key)
      return
    }
    setCash((prev) => prev + currentGood.price)
    setInventory((prev) => ({ ...prev, [currentGood.key]: Math.max(0, (prev[currentGood.key] || 0) - 1) }))
    const premiumSale = currentGood.price >= currentGood.basePrice * 1.18
    const nextStreak = premiumSale ? hotStreak + 1 : 0
    const bonusFromUpgrades = upgradeLevel > 0 && premiumSale ? 1 : 0
    const creditGain = premiumSale ? Math.min(6, 1 + Math.floor(nextStreak / 2) + bonusFromUpgrades) : 0
    if (creditGain) setBankedCredits((prev) => prev + creditGain)
    setHotStreak(nextStreak)
    setProfitPulse((prev) => prev + currentGood.price)
    if (premiumSale && nextStreak > 0 && nextStreak % 3 === 0) setUpgradeLevel((prev) => Math.min(5, prev + 1))
    const saleMood = creditGain >= 4 ? 'Massive flip' : creditGain >= 2 ? 'Hot sale' : premiumSale ? 'Solid margin' : 'Quick unload'
    setLastSaleText(`${saleMood}: sold ${currentGood.label} for ${currency(currentGood.price)}${creditGain ? ` and banked ${creditGain} credits` : ''}.`)
    setStatusText(creditGain ? `Big win, sold high and earned ${creditGain} FarmCredits.` : premiumSale ? `Strong margin on ${currentGood.label}.` : `Sold 1 ${currentGood.label}.`)
    playSound('sell')
    flash(currentGood.key)
  }

  const nextMarket = () => {
    if (gameOver) return
    const nextRound = round + 1
    const event = Math.random() < 0.88 ? EVENTS[Math.floor(Math.random() * EVENTS.length)] : null
    const nextMarketRows = makeMarket(nextRound, event, upgradeLevel)
    setRound(nextRound)
    setMarket(nextMarketRows)
    const nextWorthEstimate = cash + nextMarketRows.reduce((sum, item) => sum + ((inventory[item.key] || 0) * item.price), 0) + (bankedCredits * 20)
    setBestWorth((prev) => Math.max(prev, nextWorthEstimate))
    setEventTitle(event?.label || 'Market Watch')
    setEventText(event?.text || 'Quiet market. Prices are steady, so timing matters.')
    setStatusText(event ? `${event.label}. Move fast and exploit the swing.` : nextRound % 5 === 0 ? 'Demand spike, margins are looking juicy.' : nextRound % 3 === 0 ? 'Fresh market, scan for a bargain and flip it fast.' : 'Market refreshed, hunt the best prices.')
    if (event?.bankBonus) setBankedCredits((prev) => prev + event.bankBonus)
    playSound('advance')
    if (nextRound >= 20) {
      setGameOver(true)
      setStatusText('Trading day closed. Bank your best run and go again.')
    }
  }

  return <div style={{position:'relative', height:'100%', minHeight:compact ? '100%' : 640, background:'linear-gradient(180deg, #052e16 0%, #0f172a 100%)', color:'#fff', borderRadius:compact ? 0 : 28, padding:compact ? 12 : 18, display:'flex', flexDirection:'column', overflow:'hidden'}}>
    <div style={{display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', marginBottom:12, flexWrap:'wrap'}}>
      <div>
        <div style={{fontSize:12, opacity:.72, textTransform:'uppercase', letterSpacing:'.12em'}}>Farm market sim</div>
        <div style={{fontSize:compact ? 22 : 28, fontWeight:900}}>Trade Tycoon</div>
      </div>
      <div className='card-actions' style={{display:'flex', gap:8, flexWrap:'wrap'}}>
        <button type='button' className='btn' onClick={() => { setShowRules((v) => !v); playSound('tap') }}>{showRules ? 'Hide Rules' : 'Rules'}</button>
        <button type='button' className='btn' onClick={() => { setSoundOn((v) => !v); playSound('tap') }}>{soundOn ? 'Sound On' : 'Sound Off'}</button>
        <button type='button' className='btn btn-dark' onClick={reset}>Restart</button>
        <div style={{padding:'8px 10px', borderRadius:999, background:'rgba(255,255,255,.08)', fontSize:12, fontWeight:800}}>{syncState}</div>
      </div>
    </div>

    <div style={{display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:10, marginBottom:12}}>
      <div style={{padding:12, borderRadius:18, background:highlight === 'cash' ? 'rgba(250,204,21,.24)' : 'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.08)'}}><div style={{fontSize:12, opacity:.7}}>Cash</div><div style={{fontSize:22, fontWeight:900}}>{currency(cash)}</div></div>
      <div style={{padding:12, borderRadius:18, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.08)'}}><div style={{fontSize:12, opacity:.7}}>Net worth</div><div style={{fontSize:22, fontWeight:900}}>{currency(netWorth)}</div></div>
      <div style={{padding:12, borderRadius:18, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.08)'}}><div style={{fontSize:12, opacity:.7}}>Best worth</div><div style={{fontSize:22, fontWeight:900}}>{currency(bestWorth)}</div></div>
      <div style={{padding:12, borderRadius:18, background:profitPulse > 0 ? 'rgba(250,204,21,.22)' : 'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.08)', boxShadow: profitPulse > 0 ? '0 0 22px rgba(250,204,21,.2)' : 'none'}}><div style={{fontSize:12, opacity:.7}}>Hot streak</div><div style={{fontSize:22, fontWeight:900}}>{hotStreak}</div></div>
    </div>

    <div style={{padding:'12px 14px', borderRadius:20, background:'linear-gradient(135deg, rgba(250,204,21,.16), rgba(34,197,94,.12), rgba(255,255,255,.06))', border:'1px solid rgba(250,204,21,.2)', marginBottom:12, boxShadow:'0 12px 24px rgba(0,0,0,.14)'}}>
      <div style={{fontSize:11, opacity:.7, marginBottom:4, textTransform:'uppercase', letterSpacing:'.12em'}}>{eventTitle}</div>
      <div style={{fontWeight:900, fontSize:16, marginBottom:4}}>{statusText}</div>
      <div style={{fontSize:13, color:'#fde68a', fontWeight:700, marginBottom:6}}>{eventText}</div>
      <div style={{fontSize:12, color:'rgba(255,255,255,.82)'}}>{lastSaleText}</div>
    </div>

    <div style={{display:'grid', gap:10, flex:1, minHeight:0, overflow:'auto'}}>
      {market.map((item) => {
        const selected = selectedGood === item.key
        const stock = inventory[item.key] || 0
        const isHot = item.price >= item.basePrice * 1.2
        const isCold = item.price <= item.basePrice * 0.9
        return <button key={item.key} type='button' onClick={() => { setSelectedGood(item.key); playSound('tap') }} style={{all:'unset', cursor:'pointer'}}>
          <div style={{padding:14, borderRadius:22, background:selected ? 'linear-gradient(135deg, rgba(34,197,94,.34), rgba(15,23,42,.28))' : 'rgba(255,255,255,.08)', border:selected ? '1px solid rgba(74,222,128,.55)' : '1px solid rgba(255,255,255,.08)', boxShadow:selected ? '0 10px 22px rgba(34,197,94,.18)' : 'none', transform:highlight === item.key ? 'scale(1.01)' : 'scale(1)', transition:'transform .12s ease, box-shadow .12s ease, border-color .12s ease'}}>
            <div style={{display:'flex', justifyContent:'space-between', gap:10, alignItems:'center'}}>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <div style={{fontSize:32}}>{item.icon}</div>
                <div>
                  <div style={{fontWeight:900, fontSize:18}}>{item.label}</div>
                  <div style={{fontSize:12, opacity:.72}}>Base {currency(item.basePrice)} • Stock {stock}</div>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:28, fontWeight:900, color:isHot ? '#fde68a' : '#fff'}}>{currency(item.price)}</div>
                <div style={{fontSize:12, fontWeight:800, color:isHot ? '#fde68a' : isCold ? '#86efac' : 'rgba(255,255,255,.72)'}}>{isHot ? 'Hot flip' : isCold ? 'Cheap buy' : 'Stable market'}</div>
              </div>
            </div>
          </div>
        </button>
      })}
    </div>

    <div className='card-actions' style={{marginTop:12, display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:8}}>
      <button type='button' className='btn' onClick={buyOne}>Buy 1</button>
      <button type='button' className='btn' onClick={sellOne}>Sell 1</button>
      <button type='button' className='btn btn-dark' onClick={nextMarket}>{gameOver ? 'Closed' : 'Spin next market'}</button>
    </div>

    <div style={{marginTop:12, display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:10}}>
      <div style={{padding:12, borderRadius:18, background:'linear-gradient(135deg, rgba(250,204,21,.18), rgba(15,23,42,.28))', border:'1px solid rgba(250,204,21,.22)'}}>
        <div style={{fontSize:12, opacity:.72, marginBottom:4}}>FarmCredits banked</div>
        <div style={{fontSize:26, fontWeight:900, color:'#fde68a'}}>{bankedCredits}</div>
      </div>
      <div style={{padding:12, borderRadius:18, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.08)'}}>
        <div style={{fontSize:12, opacity:.72, marginBottom:4}}>Tycoon rank</div>
        <div style={{fontSize:18, fontWeight:900}}>{netWorth >= 520 ? 'Market Boss' : netWorth >= 360 ? 'Top Trader' : netWorth >= 220 ? 'Fast Flipper' : 'Rookie Trader'}</div>
        <div style={{fontSize:12, marginTop:6, color:'#86efac'}}>Upgrade level {upgradeLevel} • {upgradeLevel >= 4 ? 'Tycoon engine humming' : upgradeLevel >= 2 ? 'Momentum building' : 'Starting small'}</div>
      </div>
    </div>

    {showRules && <div style={{position:'absolute', inset:compact ? 12 : 18, zIndex:12, borderRadius:24, background:'rgba(2,6,23,.92)', border:'1px solid rgba(255,255,255,.12)', padding:18, overflow:'auto'}}>
      <div style={{fontSize: compact ? 16 : 18, fontWeight:900, marginBottom:8}}>Trade Tycoon Rules</div>
      <div style={{display:'grid', gap:8, fontSize:14, opacity:.92}}>
        <div>• Buy goods when prices are low.</div>
        <div>• Sell when demand spikes and prices rise.</div>
        <div>• Every strong sale can bank FarmCredits.</div>
        <div>• Big event rounds can create boom or crash moments.</div>
        <div>• Hot streaks unlock upgrade levels and bigger rewards.</div>
        <div>• After 20 market rounds, the trading day ends.</div>
      </div>
      <button type='button' className='btn btn-dark' style={{marginTop:14}} onClick={() => setShowRules(false)}>Back to market</button>
    </div>}

    {gameOver && <div style={{position:'absolute', inset:compact ? 12 : 18, zIndex:14, display:'grid', placeItems:'center', background:'rgba(2,6,23,.6)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)'}}>
      <div style={{width:'min(280px, 88vw)', textAlign:'center', padding:'22px 18px', borderRadius:24, background:'rgba(15,23,42,.95)', border:'1px solid rgba(255,255,255,.12)'}}>
        <div style={{fontSize:30, fontWeight:900, marginBottom:8}}>MARKET CLOSED</div>
        <div style={{opacity:.82, marginBottom:14}}>Net worth {currency(netWorth)} • Best {currency(bestWorth)} • FarmCredits {bankedCredits}</div>
        <button type='button' className='btn btn-dark' onClick={reset}>Trade again</button>
      </div>
    </div>}
  </div>
}
