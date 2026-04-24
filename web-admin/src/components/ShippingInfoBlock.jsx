import React from 'react'

const SHIPPING_SCOPE_LABELS = {
  local: 'Local only',
  country: 'My country only',
  continent: 'My continent only',
  worldwide: 'Worldwide',
}

const SHIPPING_COST_LABELS = {
  free: 'Free shipping',
  flat_fee: 'Flat fee',
  buyer_pays_actual: 'Buyer pays actual courier cost',
}

const formatCost = (type, amount) => {
  if (type === 'flat_fee') {
    const value = Number(amount || 0)
    return `Flat fee • ${isNaN(value) ? 'Estimate' : `${value.toFixed(2)} GHS`}`
  }
  return SHIPPING_COST_LABELS[type] || 'Shipping cost pending'
}

const ShippingInfoBlock = ({
  shipsFromCity,
  shipsFromCountry,
  shipsToScope,
  shippingCostType,
  shippingCostAmount,
  estimatedShipDays,
  shippingNotes,
  onAcknowledge,
  acknowledged,
}) => {
  const shipsFrom = [shipsFromCity, shipsFromCountry].filter(Boolean).join(', ') || 'Seller location pending'
  const shipsTo = SHIPPING_SCOPE_LABELS[shipsToScope] || 'Region pending'
  const estimated = estimatedShipDays || 'Estimate not provided'
  const cost = formatCost(shippingCostType, shippingCostAmount)

  return (
    <div className='panel shipping-info-block' style={{ padding: 12, border: '1px solid rgba(59, 130, 246, .4)', background: '#f0f9ff', marginTop: 10 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Shipping terms</div>
      <div className='list-row' style={{ marginBottom: 6 }}>
        <span style={{ fontWeight: 600 }}>Ships from</span>
        <span>{shipsFrom}</span>
      </div>
      <div className='list-row' style={{ marginBottom: 6 }}>
        <span style={{ fontWeight: 600 }}>Ships to</span>
        <span>{shipsTo}</span>
      </div>
      <div className='list-row' style={{ marginBottom: 6 }}>
        <span style={{ fontWeight: 600 }}>Estimated delivery</span>
        <span>{estimated}</span>
      </div>
      <div className='list-row' style={{ marginBottom: 6 }}>
        <span style={{ fontWeight: 600 }}>Shipping cost</span>
        <span>{cost}</span>
      </div>
      {shippingNotes && (
        <div className='list-row' style={{ marginBottom: 6 }}>
          <span style={{ fontWeight: 600 }}>Seller notes</span>
          <span>{shippingNotes}</span>
        </div>
      )}
      <div className='row2' style={{ gap: 8, marginTop: 10 }}>
        <button
          type='button'
          className='btn btn-dark'
          onClick={onAcknowledge}
          disabled={acknowledged}
        >
          {acknowledged ? 'Shipping terms acknowledged' : 'I acknowledge shipping terms'}
        </button>
        <span className='helper-text' style={{ margin: 0 }}>
          You must agree before proceeding with purchase.
        </span>
      </div>
    </div>
  )
}

export default ShippingInfoBlock
