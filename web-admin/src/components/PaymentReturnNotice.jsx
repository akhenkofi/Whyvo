import React from 'react'

const PaymentReturnNotice = ({ notice, onPrimaryAction, onDismiss, formatDateTime }) => {
  if (!notice) return null

  const amount = Number(notice.amount || notice.amount_paid || 0)
  const formattedAmount = `${notice.currency || 'GHS'} ${amount.toFixed(2)}`
  const isOrder = notice.type === 'order-payment'

  return (
    <article className='panel' style={{ marginBottom: 12, background: 'linear-gradient(135deg,#ecfdf5 0%,#eff6ff 100%)', border: '1px solid #86efac' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '.78rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '.08em' }}>Payment confirmed</div>
          <h3 style={{ margin: '4px 0 6px' }}>{notice.title}</h3>
          {isOrder ? (
            <>
              <div style={{ color: '#334155' }}>{notice.message}</div>
              {notice.listing_title && <div className='helper-text'>Item: {notice.listing_title}</div>}
              <div className='helper-text'>Amount: {formattedAmount}</div>
              <div className='helper-text'>Order #{notice.order_id || ''} is being processed. We'll update you when the seller ships.</div>
              <div className='helper-text' style={{ marginTop: 6 }}>Reference: {notice.reference}</div>
            </>
          ) : (
            <>
              <div style={{ color: '#334155' }}>{notice.message}</div>
              <div className='helper-text' style={{ marginTop: 6 }}>Reference: {notice.reference} • Verified {formatDateTime(notice.verified_at)}</div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type='button' className='btn btn-dark' onClick={onPrimaryAction}>{isOrder ? 'View orders' : 'Open access'}</button>
          <button type='button' className='btn' onClick={onDismiss}>Dismiss</button>
        </div>
      </div>
    </article>
  )
}

export default PaymentReturnNotice
