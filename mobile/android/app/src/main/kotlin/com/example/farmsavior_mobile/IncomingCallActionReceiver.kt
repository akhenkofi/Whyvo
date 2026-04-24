package com.fs.farmsaviorapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationManagerCompat

class IncomingCallActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val callId = intent.getStringExtra("callId") ?: return

    NotificationManagerCompat.from(context).cancel(callId.hashCode())

    when (intent.action) {
      "com.fs.farmsaviorapp.CALL_ACCEPT" -> {
        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
        launch?.apply {
          putExtra("incoming_call_action", "accept")
          putExtra("callId", callId)
          putExtra("mode", intent.getStringExtra("mode") ?: "audio")
          putExtra("url", intent.getStringExtra("url") ?: "/?go=community")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }?.let { context.startActivity(it) }
      }
      "com.fs.farmsaviorapp.CALL_DECLINE" -> {
        // Explicit no-op (dismiss only)
      }
    }
  }
}
