import React from 'react'

const AppSplash = ({ show }) => {
  if (!show) return null
  return (
    <div className='app-splash'>
      <div className='app-splash-inner'>
        <div style={{width:72,height:72,borderRadius:18,background:'linear-gradient(135deg,#111827,#2563eb)',display:'grid',placeItems:'center',color:'#fff',fontSize:'1.4rem',fontWeight:800,letterSpacing:'.04em',margin:'0 auto'}}>W</div>
        <p>Whyvo is loading…</p>
      </div>
    </div>
  )
}

export default AppSplash
