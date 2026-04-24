import React from 'react'
import ShippingInfoBlock from './ShippingInfoBlock'

const PublicDetailLightbox = ({
  detail,
  gallery,
  onClose,
  shippingAcknowledged,
  onAcknowledge,
  onContact,
  onSave,
}) => {
  if (!detail) return null

  const handleShare = async () => {
    try {
      await navigator.share?.({ title: detail.title, text: detail.subtitle, url: window.location.href })
    } catch {} // share failures are non-critical
  }

  return (
    <div className='lightbox' onClick={onClose}>
      <div className='lightbox-inner public-detail' onClick={(e) => e.stopPropagation()}>
        <div className='list-row' style={{ marginBottom: 8 }}>
          <strong>{detail.title}</strong>
          <button type='button' className='btn btn-dark' onClick={onClose}>Close</button>
        </div>
        {gallery}
        <div className='detail-meta' style={{ marginTop: 10 }}>
          <div className='helper-text'>{detail.subtitle}</div>
          <div className='listing-card-metrics'>{(detail.stats || []).map((item) => <span key={item}>{item}</span>)}</div>
          <div className='contact-panel'>Sign in to contact this seller/provider directly.</div>
          <ShippingInfoBlock
            shipsFromCity={detail.ships_from_city}
            shipsFromCountry={detail.ships_from_country}
            shipsToScope={detail.ships_to_scope}
            shippingCostType={detail.shipping_cost_type}
            shippingCostAmount={detail.shipping_cost_amount}
            estimatedShipDays={detail.estimated_ship_days}
            shippingNotes={detail.shipping_notes}
            acknowledged={shippingAcknowledged}
            onAcknowledge={onAcknowledge}
          />
          <div className='card-actions'>
            <button
              type='button'
              className='btn btn-dark'
              disabled={!shippingAcknowledged}
              style={{ opacity: shippingAcknowledged ? 1 : 0.6, cursor: shippingAcknowledged ? 'pointer' : 'not-allowed' }}
              onClick={onContact}
            >
              Contact Seller
            </button>
            <button type='button' className='btn' onClick={onSave}>Save Listing</button>
            <button type='button' className='btn' onClick={handleShare}>Share</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicDetailLightbox
