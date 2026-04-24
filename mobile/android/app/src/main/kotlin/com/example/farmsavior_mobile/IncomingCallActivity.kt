package com.fs.farmsaviorapp

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView

class IncomingCallActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    setShowWhenLocked(true)
    setTurnScreenOn(true)
    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
    )

    setContentView(R.layout.activity_incoming_call)

    val caller = intent.getStringExtra("caller") ?: "FarmSavior Call"
    val callId = intent.getStringExtra("callId") ?: ""
    val mode = intent.getStringExtra("mode") ?: "audio"
    val url = intent.getStringExtra("url") ?: "/?go=community"

    findViewById<TextView>(R.id.callerName).text = caller

    findViewById<Button>(R.id.acceptBtn).setOnClickListener {
      val launch = packageManager.getLaunchIntentForPackage(packageName)
      launch?.apply {
        putExtra("incoming_call_action", "accept")
        putExtra("callId", callId)
        putExtra("mode", mode)
        putExtra("url", url)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }?.let { startActivity(it) }
      finish()
    }

    findViewById<Button>(R.id.declineBtn).setOnClickListener {
      finish()
    }
  }
}
