import { useCallStore } from '@/stores/CallStore'
import { useUserInfoStore } from '@/stores/UserInfoStore'
import Message from '@/utils/Message'
import Request from '@/utils/Request'
import Api from '@/utils/Api'
import webrtcService from './webrtcService'

const SIGNAL_EVENTS = {
  CALL_INVITE: 'CALL_INVITE',
  CALL_ACCEPT: 'CALL_ACCEPT',
  CALL_REJECT: 'CALL_REJECT',
  CALL_CANCEL: 'CALL_CANCEL',
  CALL_HANGUP: 'CALL_HANGUP',
  WEBRTC_OFFER: 'WEBRTC_OFFER',
  WEBRTC_ANSWER: 'WEBRTC_ANSWER',
  WEBRTC_ICE_CANDIDATE: 'WEBRTC_ICE_CANDIDATE',
  MEDIA_AUDIO_TOGGLE: 'MEDIA_AUDIO_TOGGLE',
  MEDIA_VIDEO_TOGGLE: 'MEDIA_VIDEO_TOGGLE'
}

const CALL_TYPE_ENUM = {
  audio: 0,
  video: 1
}

const CALL_STATUS_ENUM = {
  INIT: 0,
  ACCEPTED: 1,
  REJECTED: 2,
  CANCELED: 3,
  HANGUP: 4,
  TIMEOUT: 5
}

let initialized = false
let resetTimer = null
let rtcConfigLoaded = false

const getCallStore = () => useCallStore()
const getUserInfoStore = () => useUserInfoStore()

const clearResetTimer = () => {
  if (resetTimer) {
    clearTimeout(resetTimer)
    resetTimer = null
  }
}

const scheduleReset = () => {
  clearResetTimer()
  resetTimer = setTimeout(() => {
    clearResetTimer()
    getCallStore().reset()
  }, 1500)
}

const getCurrentUserInfo = () => {
  const userInfo = getUserInfoStore().getUserInfo()
  return {
    userId: userInfo.userId,
    nickName: userInfo.nickName || userInfo.nickname || userInfo.userId,
    avatar: userInfo.avatar || ''
  }
}

const normalizeMediaType = (mediaType) => {
  if (
    mediaType === 'video' ||
    mediaType === 'VIDEO' ||
    mediaType === CALL_TYPE_ENUM.video ||
    String(mediaType) === String(CALL_TYPE_ENUM.video)
  ) {
    return 'video'
  }
  return 'voice'
}

const toCallTypeValue = (mediaType) => {
  return normalizeMediaType(mediaType) === 'video' ? CALL_TYPE_ENUM.video : CALL_TYPE_ENUM.audio
}

const updateStreams = ({ localStream, remoteStream } = {}) => {
  const callStore = getCallStore()
  if (localStream !== undefined) {
    callStore.setLocalStream(localStream)
  }
  if (remoteStream !== undefined) {
    callStore.setRemoteStream(remoteStream)
  }
}

const getTerminalMessageByStatus = (status) => {
  switch (Number(status)) {
    case CALL_STATUS_ENUM.REJECTED:
      return { storeStatus: 'rejected', text: 'Call rejected' }
    case CALL_STATUS_ENUM.CANCELED:
      return { storeStatus: 'ended', text: 'Call canceled' }
    case CALL_STATUS_ENUM.HANGUP:
      return { storeStatus: 'ended', text: 'Call ended' }
    case CALL_STATUS_ENUM.TIMEOUT:
      return { storeStatus: 'timeout', text: 'Call timeout' }
    default:
      return { storeStatus: 'ended', text: 'Call ended' }
  }
}

const finalizeCall = (nextStatus, message = '') => {
  clearResetTimer()
  const callStore = getCallStore()
  webrtcService.cleanup()
  updateStreams({ localStream: null, remoteStream: null })
  callStore.markEnded(nextStatus, message)
  scheduleReset()
}

const failCall = (message) => {
  Message.error(message)
  finalizeCall('failed', message)
}

const buildSignal = (event, callInfo, payload = {}) => {
  const currentUser = getCurrentUserInfo()
  return {
    event,
    callId: callInfo.callId,
    fromUserId: currentUser.userId,
    toUserId: callInfo.peerUserInfo.userId,
    callType: toCallTypeValue(callInfo.mediaType),
    payload,
    timestamp: Date.now()
  }
}

const sendSignal = async (signal) => {
  const result = await window.ipcRenderer.invoke('call:sendSignal', signal)
  if (!result?.success) {
    throw new Error(result?.errorMessage || 'Signal send failed')
  }
}

const loadRtcConfig = async () => {
  if (rtcConfigLoaded) {
    return
  }
  const result = await Request.get({
    url: Api.getRtcConfig,
    showLoading: false,
    showError: false
  })
  const rtcConfig = result?.data || {}
  webrtcService.setRtcConfig(rtcConfig)
  rtcConfigLoaded = true
}

const loadUserInfo = async (userId) => {
  if (!userId) {
    return {}
  }
  const result = await Request.get({
    url: Api.getUserInfoByUserId,
    params: { userId },
    showLoading: false,
    showError: false
  })
  return result?.data || {}
}

const bindWebRtcCallbacks = () => {
  return {
    onIceCandidate: async (candidate) => {
      const callStore = getCallStore()
      if (!callStore.currentCall) {
        return
      }
      try {
        await sendSignal(buildSignal(SIGNAL_EVENTS.WEBRTC_ICE_CANDIDATE, callStore.currentCall, { candidate }))
      } catch (error) {
        failCall(error?.message || 'ICE candidate send failed')
      }
    },
    onTrack: (remoteStream) => {
      updateStreams({ remoteStream })
    },
    onConnectionStateChange: (state) => {
      const callStore = getCallStore()
      if (state === 'connected') {
        callStore.setStatus('in_call')
        return
      }
      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        finalizeCall('ended', 'Call disconnected')
      }
    }
  }
}

const ensureLocalMedia = async (mediaType) => {
  await loadRtcConfig()
  const result = await webrtcService.prepareLocalStream(mediaType, bindWebRtcCallbacks())
  updateStreams(result)
}

const buildPeerUserInfo = async (signal) => {
  const fallback = {
    userId: signal.fromUserId,
    nickName: signal.fromUserId,
    avatar: ''
  }
  const userInfo = signal.payload?.userInfo || (await loadUserInfo(signal.fromUserId))
  return {
    userId: userInfo.userId || fallback.userId,
    nickName: userInfo.nickName || userInfo.nickname || fallback.nickName,
    avatar: userInfo.avatar || ''
  }
}

const createCallInfo = (callId, mediaType, peerUserInfo, direction) => {
  return {
    callId,
    mediaType: normalizeMediaType(mediaType),
    direction,
    peerUserInfo: {
      userId: peerUserInfo.userId,
      nickName: peerUserInfo.nickName || peerUserInfo.nickname || peerUserInfo.userId,
      avatar: peerUserInfo.avatar || ''
    }
  }
}

const createCallByApi = async (peerUserInfo, mediaType) => {
  return Request({
    url: Api.callCreate,
    showLoading: false,
    params: {
      toUserId: peerUserInfo.userId,
      callType: toCallTypeValue(mediaType)
    }
  })
}

const acceptCallByApi = async (callId) => {
  return Request({
    url: Api.callAccept,
    showLoading: false,
    params: { callId }
  })
}

const rejectCallByApi = async (callId) => {
  return Request({
    url: Api.callReject,
    showLoading: false,
    params: { callId }
  })
}

const cancelCallByApi = async (callId) => {
  return Request({
    url: Api.callCancel,
    showLoading: false,
    params: { callId }
  })
}

const hangupCallByApi = async (callId) => {
  return Request({
    url: Api.callHangup,
    showLoading: false,
    params: { callId }
  })
}

const startOutgoingCall = async (peerUserInfo, mediaType) => {
  const callStore = getCallStore()
  if (callStore.status !== 'idle') {
    Message.warning('A call is already in progress')
    return false
  }

  try {
    const result = await createCallByApi(peerUserInfo, mediaType)
    if (!result?.data?.callId) {
      Message.warning(result?.info || 'Failed to create call')
      return false
    }

    const callInfo = createCallInfo(result.data.callId, mediaType, peerUserInfo, 'outgoing')
    callStore.setOutgoingCall(callInfo)
    await ensureLocalMedia(callInfo.mediaType)
    return true
  } catch (error) {
    failCall(error?.message || 'Failed to start call')
    return false
  }
}

const acceptIncomingCall = async () => {
  const callStore = getCallStore()
  if (callStore.status !== 'ringing' || !callStore.pendingIncomingCall) {
    return
  }

  const callInfo = callStore.pendingIncomingCall
  callStore.acceptIncomingCall()
  try {
    await ensureLocalMedia(callInfo.mediaType)
    const result = await acceptCallByApi(callInfo.callId)
    if (!result) {
      throw new Error('Failed to accept call')
    }
  } catch (error) {
    failCall(error?.message || 'Failed to accept call')
  }
}

const rejectIncomingCall = async () => {
  const callStore = getCallStore()
  if (!callStore.pendingIncomingCall) {
    return
  }
  const callInfo = callStore.pendingIncomingCall
  try {
    await rejectCallByApi(callInfo.callId)
  } catch (error) {
    console.error(error)
  }
  finalizeCall('rejected', 'Call rejected')
}

const cancelOutgoingCall = async () => {
  const callStore = getCallStore()
  if (!callStore.currentCall) {
    return
  }
  try {
    await cancelCallByApi(callStore.currentCall.callId)
  } catch (error) {
    console.error(error)
  }
  finalizeCall('ended', 'Call canceled')
}

const hangupCall = async () => {
  const callStore = getCallStore()
  if (!callStore.currentCall) {
    return
  }
  try {
    await hangupCallByApi(callStore.currentCall.callId)
  } catch (error) {
    console.error(error)
  }
  finalizeCall('ended', 'Call ended')
}

const endCurrentCall = async () => {
  const callStore = getCallStore()
  if (callStore.status === 'calling') {
    await cancelOutgoingCall()
    return
  }
  if (['accepting', 'connecting', 'in_call'].includes(callStore.status)) {
    await hangupCall()
  }
}

const handleRemoteInvite = async (signal) => {
  const callStore = getCallStore()
  if (callStore.status !== 'idle') {
    return
  }

  callStore.setIncomingCall(
    createCallInfo(signal.callId, signal.callType, await buildPeerUserInfo(signal), 'incoming')
  )
}

const handleRemoteAccept = async (signal) => {
  const callStore = getCallStore()
  if (callStore.status !== 'calling' || callStore.currentCall?.callId !== signal.callId) {
    return
  }

  callStore.setStatus('connecting')
  try {
    const sdp = await webrtcService.createOffer()
    await sendSignal(buildSignal(SIGNAL_EVENTS.WEBRTC_OFFER, callStore.currentCall, { sdp }))
  } catch (error) {
    failCall(error?.message || 'Failed to create offer')
  }
}

const handleRemoteOffer = async (signal) => {
  const callStore = getCallStore()
  if (!callStore.currentCall || callStore.currentCall.callId !== signal.callId) {
    return
  }

  callStore.setStatus('connecting')
  try {
    await webrtcService.handleRemoteOffer(signal.payload?.sdp)
    const sdp = await webrtcService.createAnswer()
    await sendSignal(buildSignal(SIGNAL_EVENTS.WEBRTC_ANSWER, callStore.currentCall, { sdp }))
  } catch (error) {
    failCall(error?.message || 'Failed to handle offer')
  }
}

const handleRemoteAnswer = async (signal) => {
  const callStore = getCallStore()
  if (!callStore.currentCall || callStore.currentCall.callId !== signal.callId) {
    return
  }
  try {
    await webrtcService.handleRemoteAnswer(signal.payload?.sdp)
  } catch (error) {
    failCall(error?.message || 'Failed to handle answer')
  }
}

const handleRemoteCandidate = async (signal) => {
  const callStore = getCallStore()
  if (!callStore.currentCall || callStore.currentCall.callId !== signal.callId) {
    return
  }
  try {
    await webrtcService.addRemoteCandidate(signal.payload?.candidate)
  } catch (error) {
    failCall(error?.message || 'Failed to handle ICE candidate')
  }
}

const handleMediaAudioToggle = (signal) => {
  const callStore = getCallStore()
  if (!callStore.currentCall || callStore.currentCall.callId !== signal.callId) {
    return
  }
  callStore.setPeerAudioEnabled(signal.payload?.audioEnabled !== false)
}

const handleMediaVideoToggle = (signal) => {
  const callStore = getCallStore()
  if (!callStore.currentCall || callStore.currentCall.callId !== signal.callId) {
    return
  }
  callStore.setPeerVideoEnabled(signal.payload?.videoEnabled !== false)
}

const normalizeIncomingSignal = (message) => {
  if (!message) {
    return null
  }
  if (message.event) {
    return message
  }
  if (Number(message.messageType) === 23 && message.extendData?.event) {
    return message.extendData
  }
  if (message.bizType === 'call' && message.signalType) {
    return {
      event: message.signalType,
      callId: message.callId,
      fromUserId: message.fromUserId,
      toUserId: message.toUserId,
      callType: toCallTypeValue(message.mediaType),
      payload: message.payload || {},
      timestamp: message.timestamp
    }
  }
  return null
}

const handleTerminalEvent = (signal, fallbackStatus) => {
  const status = signal.payload?.status
  const fallbackTextMap = {
    rejected: 'Call rejected',
    ended: 'Call ended',
    timeout: 'Call timeout'
  }
  const nextStatus = status == null ? fallbackStatus : getTerminalMessageByStatus(status).storeStatus
  const nextText = status == null ? fallbackTextMap[fallbackStatus] || 'Call ended' : getTerminalMessageByStatus(status).text

  if (typeof nextStatus === 'string') {
    finalizeCall(nextStatus, nextText)
    return
  }

  finalizeCall('ended', 'Call ended')
}

const handleSignal = async (_, rawMessage) => {
  const signal = normalizeIncomingSignal(rawMessage)
  if (!signal) {
    return
  }

  const currentUser = getCurrentUserInfo()
  if (signal.toUserId && signal.toUserId !== currentUser.userId) {
    return
  }

  switch (signal.event) {
    case SIGNAL_EVENTS.CALL_INVITE:
      await handleRemoteInvite(signal)
      break
    case SIGNAL_EVENTS.CALL_ACCEPT:
      await handleRemoteAccept(signal)
      break
    case SIGNAL_EVENTS.CALL_REJECT:
      handleTerminalEvent(signal, 'rejected')
      break
    case SIGNAL_EVENTS.CALL_CANCEL:
    case SIGNAL_EVENTS.CALL_HANGUP:
      handleTerminalEvent(signal, 'ended')
      break
    case SIGNAL_EVENTS.WEBRTC_OFFER:
      await handleRemoteOffer(signal)
      break
    case SIGNAL_EVENTS.WEBRTC_ANSWER:
      await handleRemoteAnswer(signal)
      break
    case SIGNAL_EVENTS.WEBRTC_ICE_CANDIDATE:
      await handleRemoteCandidate(signal)
      break
    case SIGNAL_EVENTS.MEDIA_AUDIO_TOGGLE:
      handleMediaAudioToggle(signal)
      break
    case SIGNAL_EVENTS.MEDIA_VIDEO_TOGGLE:
      handleMediaVideoToggle(signal)
      break
  }
}

const toggleMute = async () => {
  const callStore = getCallStore()
  if (!callStore.currentCall) {
    return
  }

  const nextValue = !callStore.isMuted
  webrtcService.setAudioMuted(nextValue)
  callStore.setMuted(nextValue)

  try {
    await sendSignal(
      buildSignal(SIGNAL_EVENTS.MEDIA_AUDIO_TOGGLE, callStore.currentCall, { audioEnabled: !nextValue })
    )
  } catch (error) {
    console.error(error)
  }
}

const toggleCamera = async () => {
  const callStore = getCallStore()
  if (!callStore.currentCall) {
    return
  }

  const nextValue = !callStore.isCameraEnabled
  webrtcService.setCameraEnabled(nextValue)
  callStore.setCameraEnabled(nextValue)

  try {
    await sendSignal(
      buildSignal(SIGNAL_EVENTS.MEDIA_VIDEO_TOGGLE, callStore.currentCall, { videoEnabled: nextValue })
    )
  } catch (error) {
    console.error(error)
  }
}

const initCallService = () => {
  if (initialized) {
    return
  }
  initialized = true
  window.ipcRenderer.on('call:signal', handleSignal)
  window.ipcRenderer.on('reLogin', () => {
    clearResetTimer()
    webrtcService.cleanup()
    getCallStore().reset()
    rtcConfigLoaded = false
  })
}

export {
  initCallService,
  startOutgoingCall,
  acceptIncomingCall,
  rejectIncomingCall,
  endCurrentCall,
  toggleMute,
  toggleCamera,
  SIGNAL_EVENTS
}
