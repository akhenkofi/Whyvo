import React, { useState } from 'react'
import DisputeCenter from './DisputeCenter'
import MovableFloatingButton from './MovableFloatingButton'

const DisputeButton = ({ role = 'buyer' }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      {open && (
        <div className='lightbox' style={{ background:'rgba(15,23,42,.55)', zIndex: 5400 }} onClick={() => setOpen(false)}>
          <div className='lightbox-inner' style={{ width:'100%', maxWidth:700, borderRadius:18, margin:'auto', position:'relative' }} onClick={(e) => e.stopPropagation()}>
            <div className='list-row' style={{ justifyContent:'space-between', padding:16 }}>
              <strong className='text-lg'>Disputes</strong>
              <button type='button' className='btn btn-light' onClick={() => setOpen(false)}>Close</button>
            </div>
            <DisputeCenter role={role} />
          </div>
        </div>
      )}
      <MovableFloatingButton
        storageKey='farmsavior-floating-disputes'
        label='Disputes'
        shortLabel='!'
        color='#c53030'
        zIndex={5400}
        defaultPosition={{ bottom: 72, right: 18 }}
        onClick={() => setOpen(true)}
      />
    </>
  )
}

export default DisputeButton
