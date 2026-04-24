import React from 'react'

const AppSplash = ({ show }) => {
  if (!show) return null
  return (
    <div className='app-splash'>
      <div className='app-splash-inner'>
        <img src='/assets/farmsavior-logo.jpg' alt='FarmSavior' />
        <p>FarmSavior is loading…</p>
      </div>
    </div>
  )
}

export default AppSplash
