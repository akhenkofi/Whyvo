package com.fs.farmsaviorapp

import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val channelName = "farmsavior/call_push"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName)
            .setMethodCallHandler { call, result ->
                if (call.method == "getInitialCallAction") {
                    val action = intent?.getStringExtra("incoming_call_action")
                    val callId = intent?.getStringExtra("callId")
                    val mode = intent?.getStringExtra("mode")
                    val url = intent?.getStringExtra("url")
                    result.success(
                        mapOf(
                            "action" to (action ?: ""),
                            "callId" to (callId ?: ""),
                            "mode" to (mode ?: "audio"),
                            "url" to (url ?: "/?go=community")
                        )
                    )
                } else {
                    result.notImplemented()
                }
            }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }
}
