import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

export const useCallStore = defineStore('call', () => {
  const status = ref('idle')
  const currentCall = ref(null)
  const pendingIncomingCall = ref(null)
  const localStream = shallowRef(null)
  const remoteStream = shallowRef(null)
  const errorMessage = ref('')
  const connectedAt = ref(0)
  const endedReason = ref('')
  const isMuted = ref(false)
  const isCameraEnabled = ref(true)
  const peerAudioEnabled = ref(true)
  const peerVideoEnabled = ref(true)

  const mediaType = computed(() => currentCall.value?.mediaType || pendingIncomingCall.value?.mediaType || 'voice')
  const peerUser = computed(() => currentCall.value?.peerUserInfo || pendingIncomingCall.value?.peerUserInfo || {})
  const activeCallVisible = computed(() => {
    return ['calling', 'accepting', 'connecting', 'in_call', 'ended', 'rejected', 'busy', 'timeout', 'failed'].includes(status.value)
  })

  const setStatus = (nextStatus, message = '') => {
    status.value = nextStatus
    errorMessage.value = message || ''
    if (nextStatus === 'in_call' && !connectedAt.value) {
      connectedAt.value = Date.now()
    }
    if (nextStatus !== 'in_call') {
      connectedAt.value = 0
    }
  }

  const setOutgoingCall = (callInfo) => {
    currentCall.value = callInfo
    pendingIncomingCall.value = null
    endedReason.value = ''
    isMuted.value = false
    isCameraEnabled.value = callInfo.mediaType === 'video'
    peerAudioEnabled.value = true
    peerVideoEnabled.value = callInfo.mediaType === 'video'
    setStatus('calling')
  }

  const setIncomingCall = (callInfo) => {
    pendingIncomingCall.value = callInfo
    currentCall.value = null
    endedReason.value = ''
    isMuted.value = false
    isCameraEnabled.value = callInfo.mediaType === 'video'
    peerAudioEnabled.value = true
    peerVideoEnabled.value = callInfo.mediaType === 'video'
    setStatus('ringing')
  }

  const acceptIncomingCall = () => {
    currentCall.value = pendingIncomingCall.value
    pendingIncomingCall.value = null
    endedReason.value = ''
    setStatus('accepting')
  }

  const setLocalStream = (stream) => {
    localStream.value = stream || null
  }

  const setRemoteStream = (stream) => {
    remoteStream.value = stream || null
  }

  const setMuted = (value) => {
    isMuted.value = !!value
  }

  const setCameraEnabled = (value) => {
    isCameraEnabled.value = !!value
  }

  const setPeerAudioEnabled = (value) => {
    peerAudioEnabled.value = !!value
  }

  const setPeerVideoEnabled = (value) => {
    peerVideoEnabled.value = !!value
  }

  const markEnded = (nextStatus, reason = '') => {
    endedReason.value = reason || ''
    setStatus(nextStatus, reason)
  }

  const reset = () => {
    status.value = 'idle'
    currentCall.value = null
    pendingIncomingCall.value = null
    localStream.value = null
    remoteStream.value = null
    errorMessage.value = ''
    connectedAt.value = 0
    endedReason.value = ''
    isMuted.value = false
    isCameraEnabled.value = true
    peerAudioEnabled.value = true
    peerVideoEnabled.value = true
  }

  return {
    status,
    currentCall,
    pendingIncomingCall,
    localStream,
    remoteStream,
    errorMessage,
    connectedAt,
    endedReason,
    isMuted,
    isCameraEnabled,
    peerAudioEnabled,
    peerVideoEnabled,
    mediaType,
    peerUser,
    activeCallVisible,
    setStatus,
    setOutgoingCall,
    setIncomingCall,
    acceptIncomingCall,
    setLocalStream,
    setRemoteStream,
    setMuted,
    setCameraEnabled,
    setPeerAudioEnabled,
    setPeerVideoEnabled,
    markEnded,
    reset
  }
})
