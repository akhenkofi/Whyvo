import React from 'react'

const AppSplash = ({ show }) => {
  if (!show) return null
  return (
    <div className='app-splash' style={{background:'#fff'}}>
      <div style={{minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', padding:'56px 24px 36px'}}>
        <div />
        <div className='app-splash-inner' style={{display:'flex', flexDirection:'column', alignItems:'center', gap:16}}>
          <img src='/assets/whyvo-app-icon.jpg' alt='Whyvo' style={{width:76, height:76, borderRadius:20, objectFit:'cover'}} />
          <p style={{margin:0, fontSize:'1rem', color:'#111827', fontWeight:600}}>Whyvo</p>
        </div>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
          <div style={{fontSize:'.9rem', color:'#6b7280'}}>from</div>
          <div style={{fontSize:'1.15rem', color:'#111827', fontWeight:700}}>Whyvo</div>
        </div>
      </div>
    </div>
  )
}

export default AppSplash
