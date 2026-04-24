import Flutter
import UIKit
import PushKit
import CallKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate, PKPushRegistryDelegate, CXProviderDelegate {
  private var provider: CXProvider?
  private var currentCallUUID: UUID?
  private var pendingPayload: [String: Any] = [:]

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    setupCallKit()
    setupPushKit()

    if let controller = window?.rootViewController as? FlutterViewController {
      let channel = FlutterMethodChannel(name: "farmsavior/call_push", binaryMessenger: controller.binaryMessenger)
      channel.setMethodCallHandler { [weak self] call, result in
        guard call.method == "getInitialCallAction" else {
          result(FlutterMethodNotImplemented)
          return
        }
        let action = UserDefaults.standard.string(forKey: "farmsavior_call_action") ?? ""
        let payload = UserDefaults.standard.dictionary(forKey: "farmsavior_call_payload") ?? [:]
        result([
          "action": action,
          "callId": payload["callId"] as? String ?? "",
          "mode": payload["mode"] as? String ?? "audio",
          "url": payload["url"] as? String ?? "/?go=community"
        ])
        UserDefaults.standard.removeObject(forKey: "farmsavior_call_action")
        UserDefaults.standard.removeObject(forKey: "farmsavior_call_payload")
        self?.pendingPayload = [:]
      }
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
  }

  private func setupPushKit() {
    let registry = PKPushRegistry(queue: DispatchQueue.main)
    registry.delegate = self
    registry.desiredPushTypes = [.voIP]
  }

  private func setupCallKit() {
    let config = CXProviderConfiguration(localizedName: "FarmSavior")
    config.supportsVideo = true
    config.maximumCallsPerCallGroup = 1
    config.maximumCallGroups = 1
    config.supportedHandleTypes = [.generic]
    config.includesCallsInRecents = false
    let provider = CXProvider(configuration: config)
    provider.setDelegate(self, queue: nil)
    self.provider = provider
  }

  func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
    guard type == .voIP else { return }
    let token = pushCredentials.token.map { String(format: "%02x", $0) }.joined()
    UserDefaults.standard.set(token, forKey: "farmsavior_voip_token")
  }

  func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {}

  func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
    handleVoipPush(payload: payload, type: type)
    completion()
  }

  func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, withCompletionHandler completion: @escaping () -> Void) {
    handleVoipPush(payload: payload, type: type)
    completion()
  }

  private func handleVoipPush(payload: PKPushPayload, type: PKPushType) {
    guard type == .voIP else { return }
    let root = payload.dictionaryPayload
    let data = (root["data"] as? [String: Any]) ?? root
    let pushType = (data["type"] as? String ?? "").lowercased()
    guard pushType == "incoming_call" else { return }

    let callId = (data["callId"] as? String) ?? UUID().uuidString
    let mode = (data["mode"] as? String) ?? "audio"
    let caller = (data["caller_name"] as? String) ?? "FarmSavior Call"
    let url = (data["url"] as? String) ?? "/?go=community"

    pendingPayload = ["callId": callId, "mode": mode, "url": url]
    let uuid = UUID(uuidString: callId) ?? UUID()
    currentCallUUID = uuid

    let update = CXCallUpdate()
    update.remoteHandle = CXHandle(type: .generic, value: caller)
    update.localizedCallerName = caller
    update.hasVideo = mode.lowercased() == "video"

    provider?.reportNewIncomingCall(with: uuid, update: update, completion: { _ in })
  }

  func providerDidReset(_ provider: CXProvider) {
    currentCallUUID = nil
    pendingPayload = [:]
  }

  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    UserDefaults.standard.set("accept", forKey: "farmsavior_call_action")
    UserDefaults.standard.set(pendingPayload, forKey: "farmsavior_call_payload")
    action.fulfill()
  }

  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    UserDefaults.standard.set("decline", forKey: "farmsavior_call_action")
    UserDefaults.standard.set(pendingPayload, forKey: "farmsavior_call_payload")
    action.fulfill()
  }
}
