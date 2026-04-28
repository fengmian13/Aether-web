const DEFAULT_RTC_CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
}

class WebRtcService {
  constructor() {
    this.reset()
  }

  reset() {
    this.pc = null
    this.localStream = null
    this.remoteStream = null
    this.pendingCandidates = []
    this.remoteDescriptionReady = false
    this.rtcConfig = { ...DEFAULT_RTC_CONFIG }
    this.callbacks = {
      onIceCandidate: null,
      onTrack: null,
      onConnectionStateChange: null
    }
  }

  setRtcConfig(config) {
    if (!config || typeof config !== 'object') {
      this.rtcConfig = { ...DEFAULT_RTC_CONFIG }
      return
    }

    const iceServers = Array.isArray(config.iceServers) && config.iceServers.length ? config.iceServers : DEFAULT_RTC_CONFIG.iceServers
    this.rtcConfig = {
      ...DEFAULT_RTC_CONFIG,
      ...config,
      iceServers
    }
  }

  async prepareLocalStream(mediaType, callbacks = {}) {
    const needVideo = mediaType === 'video'
    const shouldRefresh = !this.localStream || !!this.localStream.getVideoTracks().length !== needVideo

    this.callbacks = {
      ...this.callbacks,
      ...callbacks
    }

    if (shouldRefresh) {
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop())
      }
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: needVideo
      })
    }

    this.ensurePeerConnection()
    this.bindLocalTracks()

    return {
      localStream: this.localStream,
      remoteStream: this.remoteStream
    }
  }

  ensurePeerConnection() {
    if (this.pc) {
      return this.pc
    }

    this.pc = new RTCPeerConnection(this.rtcConfig)
    this.remoteStream = new MediaStream()
    this.pendingCandidates = []
    this.remoteDescriptionReady = false

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.onIceCandidate?.(event.candidate.toJSON())
      }
    }

    this.pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        if (!this.remoteStream.getTracks().some((item) => item.id === track.id)) {
          this.remoteStream.addTrack(track)
        }
      })
      this.callbacks.onTrack?.(this.remoteStream)
    }

    this.pc.onconnectionstatechange = () => {
      this.callbacks.onConnectionStateChange?.(this.pc.connectionState)
    }

    return this.pc
  }

  bindLocalTracks() {
    if (!this.pc || !this.localStream) {
      return
    }
    const senderTrackIds = this.pc.getSenders().map((sender) => sender.track?.id).filter(Boolean)
    this.localStream.getTracks().forEach((track) => {
      if (!senderTrackIds.includes(track.id)) {
        this.pc.addTrack(track, this.localStream)
      }
    })
  }

  async createOffer() {
    this.ensurePeerConnection()
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)
    return this.pc.localDescription?.sdp
  }

  async handleRemoteOffer(sdp) {
    this.ensurePeerConnection()
    await this.pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }))
    this.remoteDescriptionReady = true
    await this.flushPendingCandidates()
  }

  async createAnswer() {
    this.ensurePeerConnection()
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    return this.pc.localDescription?.sdp
  }

  async handleRemoteAnswer(sdp) {
    if (!this.pc) {
      return
    }
    await this.pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }))
    this.remoteDescriptionReady = true
    await this.flushPendingCandidates()
  }

  async addRemoteCandidate(candidate) {
    if (!candidate) {
      return
    }
    if (!this.pc || !this.remoteDescriptionReady) {
      this.pendingCandidates.push(candidate)
      return
    }
    await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
  }

  async flushPendingCandidates() {
    if (!this.pc || !this.remoteDescriptionReady) {
      return
    }
    const queue = [...this.pendingCandidates]
    this.pendingCandidates = []
    for (const candidate of queue) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }

  setAudioMuted(muted) {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted
    })
  }

  setCameraEnabled(enabled) {
    this.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = !!enabled
    })
  }

  cleanup() {
    if (this.pc) {
      this.pc.onicecandidate = null
      this.pc.ontrack = null
      this.pc.onconnectionstatechange = null
      this.pc.close()
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop())
    }
    this.reset()
  }
}

export default new WebRtcService()
