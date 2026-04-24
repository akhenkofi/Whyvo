import React, { useEffect, useState } from 'react'
import { fetchOrders } from '../services/api'

const SellerDashboard = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchOrders()
        const allOrders = Array.isArray(data) ? data : (data?.orders || [])
        const sellerOrders = allOrders.filter((order) => {
          const buyerId = String(order?.buyer_id || order?.buyer_marketplace_id || '')
          const sellerId = String(order?.seller_id || order?.seller_marketplace_id || '')
          const payoutState = String(order?.payout_status || order?.escrow_status || order?.status || '').toUpperCase()
          return sellerId && buyerId !== sellerId && ['READY_FOR_RELEASE', 'SCHEDULED', 'QUEUED', 'BUYER_CONFIRMED', 'RELEASED', 'COMPLETED'].includes(payoutState)
        })
        setOrders(sellerOrders)
      } catch (err) {
        setError('Unable to load seller earnings right now. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatCurrency = (value, currency = 'GHS') => `${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
  const payoutAmount = (order) => Number(order?.seller_payout_amount || order?.seller_net || 0)
  const platformFeeAmount = (order) => {
    const direct = Number(order?.platform_fee_amount ?? order?.platform_fee)
    if (direct > 1) return direct
    const gross = Number(order?.gross_amount || 0)
    const net = payoutAmount(order)
    const derived = gross - net
    return derived > 0 ? derived : direct
  }
  const payoutStatus = (order) => String(order?.payout_status || order?.escrow_status || order?.status || '').toUpperCase()
  const completedStates = ['RELEASED', 'COMPLETED']
  const pendingStates = ['READY_FOR_RELEASE', 'SCHEDULED', 'QUEUED', 'BUYER_CONFIRMED']

  const pendingPayouts = orders.filter(order => pendingStates.includes(payoutStatus(order)))
  const completedPayouts = orders.filter(order => completedStates.includes(payoutStatus(order)))
  const totalEarnings = pendingPayouts.concat(completedPayouts.filter(order => !pendingPayouts.some(p => String(p?.id) === String(order?.id)))).reduce((sum, order) => sum + payoutAmount(order), 0)

  return (
    <section className='panel' style={{ marginTop: 20 }}>
      <h3>Seller earnings dashboard</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 10 }}>
        <div className='panel' style={{ padding: 12 }}>
          <div className='helper-text'>Total earnings</div>
          <strong>{formatCurrency(totalEarnings)}</strong>
        </div>
        <div className='panel' style={{ padding: 12 }}>
          <div className='helper-text'>Pending payouts</div>
          <strong>{pendingPayouts.length}</strong>
        </div>
        <div className='panel' style={{ padding: 12 }}>
          <div className='helper-text'>Completed payouts</div>
          <strong>{completedPayouts.length}</strong>
        </div>
      </div>
      {error && <div className='helper-text' style={{ color: 'red' }}>{error}</div>}
      {loading ? (
        <div className='helper-text'>Loading seller earnings…</div>
      ) : (
        <div className='list' style={{ marginTop: 10 }}>
          <div className='list-row list-header' style={{ fontWeight: 700 }}>
            <span>Order</span>
            <span>Status</span>
            <span>Payout</span>
            <span>Platform fee</span>
          </div>
          {orders.map(order => {
            const status = payoutStatus(order) || 'PENDING'
            return (
              <div key={`seller-order-${order.id}`} className='list-row'>
                <span>#{order.id}</span>
                <span>{status}</span>
                <span>{formatCurrency(payoutAmount(order), order?.currency || 'GHS')}</span>
                <span>{formatCurrency(platformFeeAmount(order), order?.currency || 'GHS')}</span>
              </div>
            )
          })}
          {!orders.length && !loading && <div className='helper-text'>No seller orders yet.</div>}
        </div>
      )}
    </section>
  )
}

export default SellerDashboard
