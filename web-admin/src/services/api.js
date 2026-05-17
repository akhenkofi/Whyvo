import axios from 'axios'

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL
const CONFIG_ERROR_MESSAGE = 'Missing required VITE_API_BASE_URL. Whyvo frontend will stay in offline setup mode until a backend URL is configured.'

if (!rawBaseUrl && typeof window !== 'undefined') {
  window.__WHYVO_CONFIG_ERROR__ = CONFIG_ERROR_MESSAGE
}

const baseURL = rawBaseUrl
  ? rawBaseUrl.replace(/^http:\/\/api\.farmsavior\.com/i, 'https://api.farmsavior.com')
  : ''

const api = axios.create({ baseURL })

const AUTH_FAILURE_KEY = 'farmsavior_auth_failures'
const AUTH_FAILURE_WINDOW_MS = 10 * 60 * 1000
const AUTH_FAILURE_THRESHOLD = 3

const readAuthFailures = () => {
  try {
    const raw = localStorage.getItem(AUTH_FAILURE_KEY)
    const parsed = JSON.parse(raw || '[]')
    const now = Date.now()
    return Array.isArray(parsed)
      ? parsed.filter((ts) => Number.isFinite(ts) && now - ts < AUTH_FAILURE_WINDOW_MS)
      : []
  } catch {
    return []
  }
}

const writeAuthFailures = (items) => {
  try {
    localStorage.setItem(AUTH_FAILURE_KEY, JSON.stringify(items))
  } catch {}
}

const clearAuthFailures = () => {
  try {
    localStorage.removeItem(AUTH_FAILURE_KEY)
  } catch {}
}

const recordAuthFailure = () => {
  const next = [...readAuthFailures(), Date.now()]
  writeAuthFailures(next)
  return next.length
}

const forceLogoutToLogin = () => {
  clearAuthFailures()
  try { localStorage.removeItem('farmsavior_token') } catch {}
  try { sessionStorage.setItem('farmsavior_auth_expired', '1') } catch {}
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.set('public', '1')
    url.searchParams.set('auth', 'login')
    url.searchParams.set('reason', 'session-expired')
    window.location.href = url.toString()
  }
}

let inFlightRequests = 0
const emitNetworkActivity = () => {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('farmsavior:network-activity', { detail: { inFlight: inFlightRequests, busy: inFlightRequests > 0 } }))
  } catch {}
}

api.interceptors.request.use((config) => {
  inFlightRequests += 1
  emitNetworkActivity()
  const token = localStorage.getItem('farmsavior_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => {
    inFlightRequests = Math.max(0, inFlightRequests - 1)
    emitNetworkActivity()
    if (String(res?.config?.url || '').includes('/auth/me')) clearAuthFailures()
    return res
  },
  (error) => {
    inFlightRequests = Math.max(0, inFlightRequests - 1)
    emitNetworkActivity()
    const status = error?.response?.status
    const detailSource = error?.response?.data?.detail
    const detail = typeof detailSource === 'string'
      ? detailSource.toLowerCase()
      : JSON.stringify(detailSource || {}).toLowerCase()
    const reqUrl = String(error?.config?.url || '')
    const isAuthMe = reqUrl.includes('/auth/me')
    const isAgoraTokenRequest = reqUrl.includes('/agora-token')

    // Prevent random logout loops during deploy/restarts/network hiccups.
    // Only hard-logout on repeated identity failures, or immediately for clearly invalid tokens.
    const isStrongTokenFailure =
      detail.includes('signature') ||
      detail.includes('token') ||
      detail.includes('jwt') ||
      detail.includes('expired') ||
      detail.includes('not enough segments')

    const isIdentityFailure =
      detail.includes('user not found') ||
      detail.includes('missing bearer token') ||
      (status === 401 && isAuthMe)

    if (!isAgoraTokenRequest) {
      if (isStrongTokenFailure) {
        forceLogoutToLogin()
      } else if (isIdentityFailure) {
        const failures = recordAuthFailure()
        if (failures >= AUTH_FAILURE_THRESHOLD) forceLogoutToLogin()
      }
    }

    return Promise.reject(error)
  }
)

export const register = async (payload) => (await api.post('/auth/register', payload)).data
export const login = async (payload) => (await api.post('/auth/login', payload)).data
export const verifyOtp = async (payload) => (await api.post('/auth/verify-otp', payload)).data
export const fetchMe = async () => {
  try {
    return (await api.get('/auth/me')).data
  } catch (error) {
    const status = error?.response?.status
    const reqUrl = String(error?.config?.url || '')
    if (status === 401 && reqUrl.includes('/auth/me')) {
      await new Promise((resolve) => setTimeout(resolve, 700))
      return (await api.get('/auth/me')).data
    }
    throw error
  }
}
export const updateMe = async (payload) => (await api.put('/auth/me', payload)).data
export const sendEmailChangeOtp = async () => (await api.post('/auth/email/send-otp')).data
export const verifyEmailChangeOtp = async (payload) => (await api.post('/auth/email/verify-otp', payload)).data
export const changePassword = async (payload) => (await api.post('/auth/change-password', payload)).data
export const deleteAccount = async (payload) => (await api.post('/auth/delete-account', payload)).data

export const fetchMetrics = async () => (await api.get('/admin/metrics')).data
export const fetchAdminDisputes = async () => (await api.get('/admin/disputes')).data
export const fetchAdminFraudFlags = async () => (await api.get('/admin/fraud-flags')).data
export const fetchUsers = async () => (await api.get('/users')).data

export const fetchListings = async () => (await api.get('/marketplace/listings')).data
export const createListing = async (payload) => (await api.post('/marketplace/listings', payload)).data
export const fetchMyListings = async (params) => (await api.get('/listings/mine', { params })).data
export const updateListing = async (id, payload) => (await api.put(`/marketplace/listings/${id}`, payload)).data
export const deleteListing = async (id) => (await api.delete(`/marketplace/listings/${id}`)).data
export const patchListingPriceQty = async (id, payload) => (await api.patch(`/marketplace/listings/${id}/price-qty`, payload)).data

export const fetchLivestock = async () => (await api.get('/marketplace/livestock')).data
export const createLivestock = async (payload) => (await api.post('/marketplace/livestock', payload)).data
export const updateLivestock = async (id, payload) => (await api.put(`/marketplace/livestock/${id}`, payload)).data
export const deleteLivestock = async (id) => (await api.delete(`/marketplace/livestock/${id}`)).data
export const patchLivestockPriceQty = async (id, payload) => (await api.patch(`/marketplace/livestock/${id}/price-qty`, payload)).data

export const fetchLogistics = async () => (await api.get('/services/logistics')).data
export const createLogistics = async (payload) => (await api.post('/services/logistics', payload)).data
export const updateLogistics = async (id, payload) => (await api.put(`/services/logistics/${id}`, payload)).data
export const deleteLogistics = async (id) => (await api.delete(`/services/logistics/${id}`)).data

export const fetchEquipment = async () => (await api.get('/services/equipment-rentals')).data
export const createEquipment = async (payload) => (await api.post('/services/equipment-rentals', payload)).data
export const updateEquipment = async (id, payload) => (await api.put(`/services/equipment-rentals/${id}`, payload)).data
export const deleteEquipment = async (id) => (await api.delete(`/services/equipment-rentals/${id}`)).data

export const fetchStorage = async () => (await api.get('/services/storage-reservations')).data
export const createStorage = async (payload) => (await api.post('/services/storage-reservations', payload)).data
export const updateStorage = async (id, payload) => (await api.put(`/services/storage-reservations/${id}`, payload)).data
export const deleteStorage = async (id) => (await api.delete(`/services/storage-reservations/${id}`)).data




export const fetchNotifications = async (userId) => (await api.get('/notifications', { params: userId ? { user_id: userId } : {} })).data
export const fetchPayoutHistory = async () => (await api.get('/payout-history')).data
export const refundOrder = async (id, payload) => (await api.post(`/orders/${id}/refund`, payload || {})).data
export const autoReleaseOrders = async (payload) => (await api.post('/orders/auto-release', payload || {})).data

export const fetchPayoutProfiles = async () => (await api.get('/payouts/profiles')).data
export const savePayoutProfile = async (payload) => (await api.post('/payouts/profiles', payload)).data
export const sendPayoutOtp = async (payload) => (await api.post('/payouts/profiles/send-otp', payload)).data
export const verifyPayoutOtp = async (payload) => (await api.post('/payouts/profiles/verify-otp', payload)).data
export const verifyPayoutProfile = async (userId, payload) => (await api.put(`/payouts/profiles/${userId}/verify`, payload)).data

export const fetchOrders = async () => (await api.get('/orders')).data
export const createOrder = async (payload) => (await api.post('/orders', payload)).data
export const fetchOrder = async (id) => (await api.get(`/orders/${id}`)).data
export const fetchOrderReceipt = async (id) => (await api.get(`/orders/${id}/receipt`)).data
export const payOrder = async (id, payload) => (await api.post(`/orders/${id}/pay`, payload)).data
export const verifyOrderPayment = async (id) => (await api.post(`/orders/${id}/verify-payment`)).data
export const updateOrderStatus = async (id, payload) => (await api.put(`/orders/${id}/status`, payload)).data
export const initializeMarketplaceOrderPayment = async (payload) => (await api.post('/payments/initialize', payload)).data
export const verifyMarketplacePayment = async (payload) => (await api.post('/payments/verify', payload)).data
export const confirmOrder = async (id) => (await api.post(`/orders/${id}/confirm`)).data
export const markOrderShipped = async (id, payload) => (await api.post(`/orders/${id}/ship`, payload)).data
export const releaseOrder = async (id) => (await api.post(`/orders/${id}/release`)).data
export const disputeOrder = async (id, payload) => (await api.post(`/orders/${id}/dispute`, payload)).data

export const fetchPayments = async () => (await api.get('/payments')).data
export const createPayment = async (payload) => (await api.post('/payments', payload)).data
export const updatePayment = async (id, payload) => (await api.put(`/payments/${id}`, payload)).data

export const fetchGamesWallet = async () => (await api.get('/games/wallet')).data
export const fetchGamesLeaderboard = async (params) => (await api.get('/games/leaderboard', { params })).data
export const submitGameScore = async (payload) => (await api.post('/games/submit-score', payload)).data
export const claimGameMission = async (payload) => (await api.post('/games/claim-mission', payload)).data
export const fetchGameState = async (params) => (await api.get('/games/state', { params })).data
export const saveGameState = async (payload) => (await api.post('/games/state', payload)).data

export const fetchAlerts = async (country) => (await api.get('/weather/alerts', { params: country ? { country } : {} })).data
export const createAlert = async (payload) => (await api.post('/weather/alerts', payload)).data
export const updateAlert = async (id, payload) => (await api.put(`/weather/alerts/${id}`, payload)).data
export const deleteAlert = async (id) => (await api.delete(`/weather/alerts/${id}`)).data
export const clearCreatedAlerts = async (country) => (await api.delete('/weather/alerts', { params: country ? { country } : {} })).data
export const syncWeather = async () => (await api.post('/weather/sync')).data
export const fetchWeatherRegions = async () => (await api.get('/weather/regions')).data
export const fetchWeatherForecastSummary = async (country, region) => (await api.get('/weather/forecast-summary', { params: { country, region } })).data

export const fetchContracts = async () => (await api.get('/trade/contracts')).data
export const createContract = async (payload) => (await api.post('/trade/contracts', payload)).data
export const updateContract = async (id, payload) => (await api.put(`/trade/contracts/${id}`, payload)).data

export const fetchIdVerifications = async () => (await api.get('/onboarding/id-verification')).data
export const createIdVerification = async (payload) => (await api.post('/onboarding/id-verification', payload)).data
export const fetchMyIdVerification = async () => (await api.get('/onboarding/id-verification/me')).data
export const submitMyIdVerification = async (payload) => (await api.post('/onboarding/id-verification/me', payload)).data

export const fetchPassports = async () => (await api.get('/onboarding/farm-passport')).data
export const createPassport = async (payload) => (await api.post('/onboarding/farm-passport', payload)).data

export const fetchVerificationApps = async () => (await api.get('/verification/applications')).data
export const analyzeVerification = async (idVerificationId) => (await api.post(`/verification/analyze/${idVerificationId}`)).data
export const analyzeAllVerifications = async () => (await api.post('/verification/analyze-all')).data
export const setVerificationDecision = async (idVerificationId, payload) => (await api.post(`/verification/decision/${idVerificationId}`, payload)).data
export const fetchApprovedAccounts = async () => (await api.get('/verification/approved-accounts')).data

export const fetchMapConfig = async () => (await api.get('/map/config')).data
export const fetchPublicNews = async () => (await api.get('/news/public')).data
export const fetchPublicWeather = async () => (await api.get('/weather/public-main')).data

export const fetchGovPrograms = async () => (await api.get('/gov/programs')).data
export const govDistributeSubsidy = async (payload) => (await api.post('/gov/subsidies/distribute', payload)).data
export const govCommunicate = async (payload) => (await api.post('/gov/communicate', payload)).data
export const fetchSpotTrading = async () => (await api.get('/market/spot-trading')).data
export const fetchSpotTradingHistory = async () => (await api.get('/market/spot-trading/history')).data
export const fetchTradeExportStats = async () => (await api.get('/trade/export-stats')).data
export const fetchLivestockRecordsPlans = async () => (await api.get('/livestock-records/subscription/plans')).data
export const fetchLivestockRecordsSubscriptionMe = async () => (await api.get('/livestock-records/subscription/me')).data
export const checkoutLivestockRecordsPlan = async (payload) => (await api.post('/livestock-records/subscription/checkout', payload)).data
export const verifyLivestockRecordsSubscription = async (reference) => (await api.get(`/livestock-records/subscription/verify/${reference}`)).data
export const syncAccountBilling = async () => (await api.post('/account/billing-sync')).data
export const fetchAccountBillingOverview = async () => (await api.get('/account/billing-overview')).data
export const fetchUniversityPlans = async (product) => (await api.get(`/university/${product}/plans`)).data
export const fetchUniversitySubscriptionMe = async (product) => (await api.get(`/university/${product}/subscription/me`)).data
export const checkoutUniversityPlan = async (product, payload) => (await api.post(`/university/${product}/subscription/checkout`, payload)).data
export const verifyUniversitySubscription = async (product, reference) => (await api.get(`/university/${product}/subscription/verify/${reference}`)).data
export const fetchPoultryUniversityPlans = async () => fetchUniversityPlans('poultry')
export const fetchPoultryUniversitySubscriptionMe = async () => fetchUniversitySubscriptionMe('poultry')
export const checkoutPoultryUniversityPlan = async (payload) => checkoutUniversityPlan('poultry', payload)
export const verifyPoultryUniversitySubscription = async (reference) => verifyUniversitySubscription('poultry', reference)
export const fetchLivestockRecordsAnimals = async (params) => (await api.get('/livestock-records/animals', { params })).data
export const fetchLivestockPurchaseSources = async (params) => (await api.get('/livestock-records/purchase-sources', { params })).data
export const saveLivestockPurchaseSource = async (payload) => (await api.post('/livestock-records/purchase-sources', payload)).data
export const createLivestockRecord = async (payload) => (await api.post('/livestock-records/animals', payload)).data
export const updateLivestockRecord = async (recordId, payload) => (await api.put(`/livestock-records/animals/${recordId}`, payload)).data
export const appendLivestockNote = async (recordId, note) => (await api.post(`/livestock-records/animals/${recordId}/notes`, { note })).data
export const deleteLivestockRecord = async (recordId) => (await api.delete(`/livestock-records/animals/${recordId}`)).data

export const registerDeviceToken = async (payload) => (await api.post('/messaging/device-token', payload)).data
export const fetchDeviceTokens = async () => (await api.get('/messaging/device-token')).data

export const analyzeDisease = async (payload) => (await api.post('/ai/disease/analyze', payload)).data
export const identifyPlant = async (payload) => (await api.post('/ai/plants/identify', payload)).data
export const identifyPest = async (payload) => (await api.post('/ai/pests/identify', payload)).data
export const fetchDiseaseScans = async () => (await api.get('/ai/disease/scans')).data
export const deleteDiseaseScan = async (scanId) => (await api.delete(`/ai/disease/scans/${scanId}`)).data
export const clearDiseaseScans = async () => (await api.delete('/ai/disease/scans')).data

export const trackAnalyticsEvent = async (payload) => (await api.post('/analytics/events', payload)).data
export const sendPresenceHeartbeat = async () => (await api.post('/analytics/presence')).data
export const fetchUsersAnalyticsSummary = async () => (await api.get('/analytics/users/summary')).data
export const fetchAdminAnalyticsSummary = async () => (await api.get('/analytics/admin/summary')).data

export const fetchWorldChatMessages = async (limit = 80) => (await api.get('/chat/world/messages', { params: { limit } })).data
export const postWorldChatMessage = async (payload) => (await api.post('/chat/world/messages', payload)).data
export const fetchWorldChatModerationQueue = async (limit = 100) => (await api.get('/chat/world/moderation/queue', { params: { limit } })).data
export const setWorldChatModerationAction = async (payload) => (await api.post('/chat/world/moderation/action', payload)).data
export const sanctionWorldChatUser = async (userId, payload) => (await api.post(`/chat/world/users/${userId}/sanction`, payload)).data

export const fetchCommunityProfileMe = async () => (await api.get('/community/profile/me')).data
export const saveCommunityProfileMe = async (payload) => (await api.post('/community/profile/me', payload)).data
export const fetchCommunityUserProfile = async (userId, postsLimit = 24) => (await api.get(`/community/users/${userId}/profile`, { params: { posts_limit: postsLimit } })).data
export const searchCommunityUsers = async (q = '', limit = 20) => (await api.get('/community/users/search', { params: { q, limit } })).data
export const fetchCommunityFollowState = async () => (await api.get('/community/follows/me')).data
export const toggleCommunityFollow = async (userId) => (await api.post(`/community/users/${userId}/follow`, {})).data
export const toggleCommunityMute = async (userId) => (await api.post(`/community/users/${userId}/mute`, {})).data
export const fetchCommunityMessageThreads = async () => (await api.get('/community/messages')).data
export const fetchCommunityMessageThread = async (userId, limit = 80) => (await api.get(`/community/messages/${userId}`, { params: { limit } })).data
export const sendCommunityMessage = async (userId, payload) => (await api.post(`/community/messages/${userId}`, payload)).data
export const pushCommunityCallSignal = async (callId, payload) => (await api.post(`/community/call-signal/${encodeURIComponent(callId)}`, payload)).data
export const pollCommunityCallSignal = async (callId, afterId = 0) => (await api.get(`/community/call-signal/${encodeURIComponent(callId)}`, { params: { after_id: afterId } })).data
export const pollCommunityCallSignalInbox = async (afterId = 0) => (await api.get('/community/call-signal/inbox', { params: { after_id: afterId } })).data
export const fetchAgoraToken = async (otherUserId) => (await api.get('/agora-token', { params: { other_user_id: otherUserId } })).data
export const fetchCommunityFeed = async (mode = 'for-you', limit = 40) => (await api.get('/community/feed', { params: { mode, limit } })).data
export const fetchCommunityPosts = async (limit = 60) => (await api.get('/community/posts', { params: { limit } })).data
export const createCommunityPost = async (payload) => (await api.post('/community/posts', payload)).data
export const updateCommunityPost = async (postId, payload) => (await api.put(`/community/posts/${postId}`, payload)).data
export const deleteCommunityPost = async (postId) => (await api.delete(`/community/posts/${postId}`)).data
export const toggleCommunityPostLike = async (postId) => (await api.post(`/community/posts/${postId}/like`, {})).data
export const fetchCommunityPostComments = async (postId) => (await api.get(`/community/posts/${postId}/comments`)).data
export const addCommunityPostComment = async (postId, payload) => (await api.post(`/community/posts/${postId}/comments`, payload)).data

export const withAuthToken = (url) => {
  if (!url) return ''
  const token = localStorage.getItem('farmsavior_token')
  if (!token) return url
  return `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
}

export const fetchMarketplaceProfile = async (userId) => (await api.get(`/marketplace/users/${userId}/profile`)).data
export const fetchMarketplaceOffers = async () => (await api.get('/marketplace/offers')).data
export const createMarketplaceOffer = async (payload) => (await api.post('/marketplace/offers', payload)).data
export const updateMarketplaceOffer = async (offerId, payload) => (await api.put(`/marketplace/offers/${offerId}`, payload)).data

export const fetchSellerOrders = async () => (await api.get('/orders/seller')).data
export const submitDispute = async (payload) => (await api.post('/disputes', payload)).data
export const respondDispute = async (disputeId, payload) => (await api.post(`/disputes/${disputeId}/respond`, payload)).data
export const resolveDispute = async (disputeId, result) => (await api.post(`/disputes/${disputeId}/resolve`, { result })).data
export const fetchDisputeByOrder = async (orderId) => (await api.get(`/disputes/order/${orderId}`)).data
export const fetchOpenDisputes = async () => (await api.get('/disputes')).data
