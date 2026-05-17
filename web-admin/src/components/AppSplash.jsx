import React from 'react'

const AppSplash = ({ show }) => {
  if (!show) return null
  return (
    <div className='app-splash' style={{ background: '#fff' }}>
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '56px 24px 30px',
        }}
      >
        <div />
        <div className='app-splash-inner' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src='/assets/whyvo-app-icon.jpg' alt='Whyvo' style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'cover' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: '.92rem', color: '#6b7280' }}>from</div>
          <div style={{ fontSize: '1.12rem', color: '#111827', fontWeight: 700 }}>Whyvo</div>
        </div>
      </div>
    </div>
  )
}

export default AppSplash
