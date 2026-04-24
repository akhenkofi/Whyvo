import React, { useEffect, useMemo, useState } from 'react'
import * as api from '../services/api'

const errMsg = (error) => {
  if (!error) return 'Unknown error'
  if (typeof error?.response?.data?.detail === 'string') return error.response.data.detail
  if (error?.message) return error.message
  return JSON.stringify(error)
}

const formatCurrency = (value, currency = 'GHS') => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return `${currency} 0.00`
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

const AdminPanel = () => {
  const [orders, setOrders] = useState([])
  const [disputes, setDisputes] = useState([])
  const [payouts, setPayouts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  const loadPanelData = async () => {
    setLoading(true)
    try {
      setLoadError('')
      const [ordersRes, disputesRes, payoutsRes, usersRes] = await Promise.all([
        api.fetchOrders(),
        api.fetchOpenDisputes().catch(() => ({ disputes: [] })),
        api.fetchPayoutHistory(),
        api.fetchUsers(),
      ])
      setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes?.orders || [])
      setDisputes((disputesRes && disputesRes.disputes) || [])
      setPayouts(payoutsRes || [])
      setUsers(usersRes || [])
    } catch (err) {
      setLoadError(`Unable to load admin dashboard: ${errMsg(err)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPanelData() }, [])

  const lookupUsername = (userId) => {
    if (!userId) return 'Unknown'
    const target = users.find((u) => Number(u.id) === Number(userId))
    if (target && target.username) return target.username
    return `User ${userId}`
  }

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + Number(order.gross_amount || 0), 0), [orders])
  const totalPlatformFees = useMemo(() => orders.reduce((sum, order) => sum + Number(order.platform_fee_amount || order.platform_fee || 0), 0), [orders])
  const totalDisputes = disputes.length

  const handleOverrideStatus = async (order) => {
    const nextStatus = window.prompt('Enter override status', order.status || order.fulfillment_status || 'PENDING')
    if (!nextStatus) return
    setActionLoading(`order-${order.id}`)
    try {
      await api.updateOrderStatus(order.id, { status: nextStatus })
      await loadPanelData()
      alert(`Order ${order.id} status updated to ${nextStatus}.`)
    } catch (err) {
      alert(`Unable to update order status: ${errMsg(err)}`)
    } finally {
      setActionLoading('')
    }
  }

  const handleResolveDispute = async (disputeId, result) => {
    setActionLoading(`dispute-${disputeId}-${result}`)
    try {
      await api.resolveDispute(disputeId, result)
      await loadPanelData()
    } catch (err) {
      alert(`Unable to resolve dispute: ${errMsg(err)}`)
    } finally {
      setActionLoading('')
    }
  }

  const completedPayouts = useMemo(() => payouts.filter((p) => {
    const status = String(p.status || '').toUpperCase()
    return status && !status.includes('PENDING')
  }), [payouts])

  const findOrderForPayout = (payout) => orders.find((order) => Number(order.id) === Number(payout.order_id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '76vh', overflowY: 'auto', paddingRight: 6 }}>
      <div className='panel' style={{ padding: 18, border: '1px solid #dbe5ef', background: 'linear-gradient(135deg,#ffffff 0%,#f8fbff 100%)', boxShadow: '0 18px 40px rgba(15,23,42,.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '.76rem', fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: '#2563eb', marginBottom: 6 }}>Admin workspace</div>
            <strong style={{ fontSize: '1.2rem', color: '#0f172a', display: 'block' }}>Admin summary</strong>
            <div className='helper-text' style={{ color: '#475569', marginTop: 4 }}>Clear status, stronger contrast, and a cleaner control surface.</div>
          </div>
          {loading ? <span className='helper-text' style={{ color: '#0f172a', fontWeight: 800, background: '#e0f2fe', padding: '8px 12px', borderRadius: 999, border: '1px solid #bae6fd' }}>Updating…</span> : null}
        </div>
      </div>
      {loadError ? <div className='panel' style={{ border: '1px solid #fecaca', background: 'linear-gradient(180deg,#fff7f7 0%,#fff1f2 100%)', color: '#7f1d1d', boxShadow: '0 14px 30px rgba(127,29,29,.08)' }}><div style={{ fontWeight: 900, marginBottom: 6, fontSize: '1rem' }}>Admin dashboard error</div><div style={{ lineHeight: 1.55, color: '#991b1b' }}>{loadError}</div><div style={{ marginTop: 12 }}><button type='button' className='btn btn-dark' onClick={loadPanelData}>Try again</button></div></div> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div className='panel' style={{ padding: 16, background: 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)', border: '1px solid #dbe5ef' }}>
          <span className='helper-text' style={{ color: '#475569', fontWeight: 800 }}>Orders</span>
          <strong style={{ color: '#0f172a', display: 'block', fontSize: '1.55rem', marginTop: 8 }}>{orders.length}</strong>
        </div>
        <div className='panel' style={{ padding: 16, background: 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)', border: '1px solid #dbe5ef' }}>
          <span className='helper-text' style={{ color: '#475569', fontWeight: 800 }}>Revenue</span>
          <strong style={{ color: '#0f172a', display: 'block', fontSize: '1.55rem', marginTop: 8 }}>{formatCurrency(totalRevenue)}</strong>
        </div>
        <div className='panel' style={{ padding: 16, background: 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)', border: '1px solid #dbe5ef' }}>
          <span className='helper-text' style={{ color: '#475569', fontWeight: 800 }}>Platform fees</span>
          <strong style={{ color: '#0f172a', display: 'block', fontSize: '1.55rem', marginTop: 8 }}>{formatCurrency(totalPlatformFees)}</strong>
        </div>
        <div className='panel' style={{ padding: 16, background: 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)', border: '1px solid #dbe5ef' }}>
          <span className='helper-text' style={{ color: '#475569', fontWeight: 800 }}>Open disputes</span>
          <strong style={{ color: '#0f172a', display: 'block', fontSize: '1.55rem', marginTop: 8 }}>{totalDisputes}</strong>
        </div>
      </div>
      <section className='panel' style={{ paddingBottom: 8, border: '1px solid #dbe5ef', background: 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)' }}>
        <h4 style={{ margin: 0, color: '#0f172a' }}>Orders</h4>
        <div className='list' style={{ maxHeight: 210, overflowY: 'auto' }}>
          {orders.length ? orders.map((order) => (
            <div key={`admin-order-${order.id}`} className='list-row' style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>#{order.id}</strong> • {order.buyer_marketplace_id || `Buyer ${order.buyer_id}`} → {order.seller_marketplace_id || `Seller ${order.seller_id}`} • {order.listing_title || 'Listing'} • {formatCurrency(order.gross_amount, order.currency || 'GHS')} • {order.status || order.fulfillment_status || 'unknown'}
              </div>
              <button
                type='button'
                className='btn btn-mini'
                disabled={actionLoading === `order-${order.id}`}
                onClick={() => handleOverrideStatus(order)}
              >
                {actionLoading === `order-${order.id}` ? 'Updating…' : 'Override status'}
              </button>
            </div>
          )) : <div className='helper-text'>No orders yet.</div>}
        </div>
      </section>
      <section className='panel' style={{ paddingBottom: 8 }}>
        <h4>Open disputes</h4>
        <div className='list' style={{ maxHeight: 210, overflowY: 'auto' }}>
          {disputes.length ? disputes.map((dispute) => (
            <div key={`admin-dispute-${dispute.id}`} className='list-row' style={{ flexDirection: 'column', gap: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <div><strong>Order #{dispute.order_id}</strong> • Buyer {dispute.buyer_marketplace_id || dispute.buyer_id}</div>
              <div className='helper-text'><strong>Buyer:</strong> {dispute.buyer_description}</div>
              {dispute.buyer_evidence_url && <div><a href={dispute.buyer_evidence_url} target='_blank' rel='noreferrer'>Buyer evidence</a></div>}
              <div className='helper-text'><strong>Seller response:</strong> {dispute.seller_description || 'Pending'}</div>
              {dispute.seller_evidence_url && <div><a href={dispute.seller_evidence_url} target='_blank' rel='noreferrer'>Seller evidence</a></div>}
              <div className='row2' style={{ gap: 8 }}>
                <button type='button' className='btn btn-dark' disabled={actionLoading === `dispute-${dispute.id}-buyer`} onClick={() => handleResolveDispute(dispute.id, 'buyer')}>Resolve for Buyer</button>
                <button type='button' className='btn btn-mini' disabled={actionLoading === `dispute-${dispute.id}-seller`} onClick={() => handleResolveDispute(dispute.id, 'seller')}>Resolve for Seller</button>
              </div>
            </div>
          )) : <div className='helper-text'>No open disputes.</div>}
        </div>
      </section>
      <section className='panel' style={{ paddingBottom: 8 }}>
        <h4>Completed payouts</h4>
        <div className='list' style={{ maxHeight: 210, overflowY: 'auto' }}>
          {completedPayouts.length ? completedPayouts.map((payout) => {
            const order = findOrderForPayout(payout)
            return (
              <div key={`admin-payout-${payout.id}`} className='list-row' style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  {payout.seller_marketplace_id || `Seller ${payout.seller_id}`} • {formatCurrency(payout.amount, payout.currency || 'GHS')} • Fee: {formatCurrency(order?.platform_fee_amount || order?.platform_fee || 0, payout.currency || 'GHS')} • {new Date(payout.created_at || payout.updated_at || payout.reference || Date.now()).toLocaleString()}
                </div>
              </div>
            )
          }) : <div className='helper-text'>No completed payouts.</div>}
        </div>
      </section>
    </div>
  )
}

export default AdminPanel
