import React, { useState } from 'react'
import AdminPanel from './AdminPanel'

const AdminPanelButton = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div className='lightbox' style={{ background: 'rgba(2,6,23,.65)', zIndex: 5400 }} onClick={() => setOpen(false)}>
          <div className='lightbox-inner public-detail' onClick={(e) => e.stopPropagation()} style={{ maxWidth: 980, width: 'min(98vw, 980px)', maxHeight: '88vh', overflow: 'hidden' }}>
            <div className='list-row' style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <strong>Admin Panel</strong>
              <button type='button' className='btn btn-light' onClick={() => setOpen(false)}>Close</button>
            </div>
            <AdminPanel />
          </div>
        </div>
      )}
      <button
        type='button'
        className='btn'
        style={{
          position: 'fixed',
          bottom: 126,
          right: 18,
          background: '#0f172a',
          color: '#fff',
          borderRadius: 999,
          padding: '12px 22px',
          zIndex: 5400,
          boxShadow: '0 6px 18px rgba(0,0,0,.35)'
        }}
        onClick={() => setOpen(true)}
      >
        Admin Panel
      </button>
    </>
  )
}

export default AdminPanelButton
