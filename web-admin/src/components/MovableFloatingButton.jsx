import React, { useEffect, useMemo, useRef, useState } from 'react'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const readStoredState = (storageKey) => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const defaultPositionForViewport = ({ right = 18, bottom = 18 } = {}, { collapsed = false, hidden = false } = {}) => {
  if (typeof window === 'undefined') return { x: 18, y: 18 }
  const estimatedWidth = hidden ? 94 : collapsed ? 150 : 270
  const estimatedHeight = hidden ? 42 : 58
  return {
    x: Math.max(12, window.innerWidth - estimatedWidth - right),
    y: Math.max(12, window.innerHeight - estimatedHeight - bottom),
  }
}

const MovableFloatingButton = ({
  storageKey,
  label,
  shortLabel,
  color = '#0f172a',
  textColor = '#fff',
  zIndex = 5400,
  defaultPosition,
  onClick,
}) => {
  const stored = useMemo(() => readStoredState(storageKey), [storageKey])
  const [collapsed, setCollapsed] = useState(Boolean(stored?.collapsed))
  const [hidden, setHidden] = useState(Boolean(stored?.hidden))
  const [position, setPosition] = useState(() => {
    if (stored && Number.isFinite(stored.x) && Number.isFinite(stored.y)) {
      return { x: Number(stored.x), y: Number(stored.y) }
    }
    return defaultPositionForViewport(defaultPosition, {
      collapsed: Boolean(stored?.collapsed),
      hidden: Boolean(stored?.hidden),
    })
  })

  const rootRef = useRef(null)
  const dragRef = useRef({ active: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0 })

  const clampToViewport = (next) => {
    if (typeof window === 'undefined') return next
    const width = rootRef.current?.offsetWidth || (hidden ? 94 : collapsed ? 150 : 270)
    const height = rootRef.current?.offsetHeight || (hidden ? 42 : 58)
    return {
      x: clamp(Number(next?.x) || 12, 12, Math.max(12, window.innerWidth - width - 12)),
      y: clamp(Number(next?.y) || 12, 12, Math.max(12, window.innerHeight - height - 12)),
    }
  }

  useEffect(() => {
    setPosition((current) => clampToViewport(current))
  }, [collapsed, hidden])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handleResize = () => setPosition((current) => clampToViewport(current))
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [collapsed, hidden])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ ...position, collapsed, hidden }))
    } catch {}
  }, [storageKey, position, collapsed, hidden])

  useEffect(() => () => {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
  }, [])

  const handlePointerMove = (event) => {
    if (!dragRef.current.active) return
    const dx = event.clientX - dragRef.current.startX
    const dy = event.clientY - dragRef.current.startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.moved = true
    setPosition(clampToViewport({
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    }))
  }

  const handlePointerUp = () => {
    dragRef.current.active = false
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    window.setTimeout(() => {
      dragRef.current.moved = false
    }, 0)
  }

  const startDragging = (event) => {
    if (event.button !== undefined && event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const triggerMainAction = () => {
    if (dragRef.current.moved) return
    if (typeof onClick === 'function') onClick()
  }

  const dockStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    borderRadius: 999,
    background: 'rgba(255,255,255,.96)',
    border: '1px solid rgba(148,163,184,.35)',
    boxShadow: '0 10px 28px rgba(15,23,42,.18)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    maxWidth: 'calc(100vw - 24px)',
  }

  const utilityStyle = {
    width: 34,
    height: 34,
    minWidth: 34,
    borderRadius: 999,
    border: '1px solid rgba(148,163,184,.45)',
    background: '#fff',
    color: '#0f172a',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(15,23,42,.08)',
    touchAction: 'none',
  }

  const actionStyle = {
    border: 'none',
    borderRadius: 999,
    padding: collapsed ? '12px 14px' : '12px 20px',
    background: color,
    color: textColor,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(0,0,0,.18)',
    whiteSpace: 'nowrap',
    minHeight: 46,
  }

  const restoreStyle = {
    border: '1px solid rgba(148,163,184,.35)',
    borderRadius: 999,
    padding: '10px 14px',
    background: 'rgba(255,255,255,.97)',
    color: '#0f172a',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 10px 28px rgba(15,23,42,.18)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  }

  return (
    <div ref={rootRef} style={{ position: 'fixed', left: position.x, top: position.y, zIndex, maxWidth: 'calc(100vw - 24px)' }}>
      {hidden ? (
        <button type='button' style={restoreStyle} onClick={() => setHidden(false)} title={`Show ${label}`}>
          + {shortLabel || label}
        </button>
      ) : (
        <div style={dockStyle}>
          <button type='button' style={utilityStyle} onPointerDown={startDragging} title={`Move ${label}`} aria-label={`Move ${label}`}>
            ⋮⋮
          </button>
          <button
            type='button'
            style={utilityStyle}
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? `Expand ${label}` : `Collapse ${label}`}
            aria-label={collapsed ? `Expand ${label}` : `Collapse ${label}`}
          >
            {collapsed ? '+' : '–'}
          </button>
          <button type='button' style={utilityStyle} onClick={() => setHidden(true)} title={`Hide ${label}`} aria-label={`Hide ${label}`}>
            ×
          </button>
          <button type='button' className='btn' style={actionStyle} onClick={triggerMainAction} title={label}>
            {collapsed ? (shortLabel || label) : label}
          </button>
        </div>
      )}
    </div>
  )
}

export default MovableFloatingButton
