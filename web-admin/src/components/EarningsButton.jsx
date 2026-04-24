import React, { useState } from 'react'
import SellerDashboard from './SellerDashboard'
import MovableFloatingButton from './MovableFloatingButton'

const EarningsButton = () => {
  const [open, setOpen] = useState(false)
  return (
    <>
      {open && (
        <div className='lightbox' style={{ background:'rgba(15,23,42,.45)', zIndex: 5200 }} onClick={() => setOpen(false)}>
          <div className='lightbox-inner' style={{ width:'100%', maxWidth:640, borderRadius:16, margin:'auto', position:'relative' }} onClick={e => e.stopPropagation()}>
            <div className='list-row' style={{ justifyContent:'space-between', padding:16 }}>
              <strong className='text-lg'>Seller Dashboard</strong>
              <button type='button' className='btn btn-light' onClick={() => setOpen(false)}>Close</button>
            </div>
            <SellerDashboard />
          </div>
        </div>
      )}
      <MovableFloatingButton
        storageKey='farmsavior-floating-earnings'
        label='Earnings'
        shortLabel='₵'
        color='#B37F00'
        zIndex={5300}
        defaultPosition={{ bottom: 18, right: 18 }}
        onClick={() => setOpen(true)}
      />
    </>
  )
}

export default EarningsButton
