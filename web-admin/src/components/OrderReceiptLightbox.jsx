import React from 'react'

const OrderReceiptLightbox = ({ receipt, onClose }) => {
  if (!receipt) return null

  return (
    <div className='lightbox' onClick={onClose}>
      <div className='lightbox-inner public-detail' onClick={(e) => e.stopPropagation()}>
        <div className='list-row' style={{ marginBottom: 8 }}>
          <strong>Receipt / Invoice</strong>
          <button type='button' className='btn btn-dark' onClick={onClose}>Close</button>
        </div>
        <pre className='receipt-box'>{JSON.stringify(receipt, null, 2)}</pre>
        <div className='card-actions'>
          <button type='button' className='btn btn-dark' onClick={() => window.print()}>Print / Save PDF</button>
        </div>
      </div>
    </div>
  )
}

export default OrderReceiptLightbox
