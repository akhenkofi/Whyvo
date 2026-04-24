package com.fs.farmsaviorapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {
  override fun onNewToken(token: String) {
    super.onNewToken(token)
    getSharedPreferences("farmsavior_push", MODE_PRIVATE)
      .edit()
      .putString("fcm_token", token)
      .apply()
  }

  override fun onMessageReceived(message: RemoteMessage) {
    super.onMessageReceived(message)
    val data = message.data
    val type = (data["type"] ?: "").lowercase()
    val ring = data["ring"] ?: "0"
    if (type != "incoming_call" || ring != "1") return

    val callId = data["callId"] ?: System.currentTimeMillis().toString()
    val mode = data["mode"] ?: "audio"
    val caller = data["caller_name"] ?: "FarmSavior Call"
    val url = data["url"] ?: "/?go=community"

    val channelId = "calls"
    createChannel(channelId)

    val fullScreenIntent = Intent(this, IncomingCallActivity::class.java).apply {
      putExtra("callId", callId)
      putExtra("mode", mode)
      putExtra("caller", caller)
      putExtra("url", url)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }

    val fullScreenPending = PendingIntent.getActivity(
      this,
      callId.hashCode(),
      fullScreenIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val acceptIntent = Intent(this, IncomingCallActionReceiver::class.java).apply {
      action = "com.fs.farmsaviorapp.CALL_ACCEPT"
      putExtra("callId", callId)
      putExtra("mode", mode)
      putExtra("url", url)
    }
    val declineIntent = Intent(this, IncomingCallActionReceiver::class.java).apply {
      action = "com.fs.farmsaviorapp.CALL_DECLINE"
      putExtra("callId", callId)
    }

    val acceptPending = PendingIntent.getBroadcast(this, ("accept_$callId").hashCode(), acceptIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val declinePending = PendingIntent.getBroadcast(this, ("decline_$callId").hashCode(), declineIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    val builder = NotificationCompat.Builder(this, channelId)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle("Incoming ${if (mode == "video") "Video" else "Audio"} Call")
      .setContentText(caller)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setFullScreenIntent(fullScreenPending, true)
      .addAction(0, "Decline", declinePending)
      .addAction(0, "Accept", acceptPending)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      builder.setStyle(
        NotificationCompat.CallStyle.forIncomingCall(
          Person.Builder().setName(caller).build(),
          declinePending,
          acceptPending
        )
      )
    }

    NotificationManagerCompat.from(this).notify(callId.hashCode(), builder.build())
  }

  private fun createChannel(channelId: String) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(channelId, "Incoming Calls", NotificationManager.IMPORTANCE_HIGH).apply {
        description = "FarmSavior incoming call alerts"
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      }
      val manager = getSystemService(NotificationManager::class.java)
      manager.createNotificationChannel(channel)
    }
  }
}
