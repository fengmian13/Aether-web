<template>
  <el-dialog
    :model-value="visible"
    width="720px"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="call-dialog"
    align-center
  >
    <div class="call-panel">
      <audio ref="remoteAudioRef" autoplay playsinline></audio>

      <template v-if="mediaType === 'video'">
        <div class="remote-video-wrap">
          <video ref="remoteVideoRef" autoplay playsinline class="remote-video"></video>
          <div v-if="!hasRemoteVideo || !callStore.peerVideoEnabled" class="video-placeholder">
            <Avatar :userId="peerUser.userId" :width="90" :showDetail="false"></Avatar>
            <div>{{ peerUser.nickName || peerUser.userId }}</div>
            <div class="status">{{ statusText }}</div>
            <div v-if="!callStore.peerVideoEnabled" class="status">Remote camera off</div>
            <div v-if="!callStore.peerAudioEnabled" class="status">Remote microphone muted</div>
          </div>
          <video ref="localVideoRef" autoplay muted playsinline class="local-video"></video>
        </div>
      </template>

      <template v-else>
        <div class="voice-wrap">
          <Avatar :userId="peerUser.userId" :width="88" :showDetail="false"></Avatar>
          <div class="nickname">{{ peerUser.nickName || peerUser.userId }}</div>
          <div class="status">{{ statusText }}</div>
          <div class="status" v-if="!callStore.peerAudioEnabled">Remote microphone muted</div>
          <div class="duration">{{ durationText }}</div>
        </div>
      </template>

      <div class="toolbar">
        <el-button @click="toggleMuteHandler">{{ callStore.isMuted ? 'Unmute' : 'Mute' }}</el-button>
        <el-button v-if="mediaType === 'video'" @click="toggleCameraHandler">
          {{ callStore.isCameraEnabled ? 'Camera Off' : 'Camera On' }}
        </el-button>
        <el-button type="danger" @click="hangupHandler">Hang Up</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useCallStore } from '@/stores/CallStore'
import { endCurrentCall, toggleCamera, toggleMute } from '@/services/call/callService'

const callStore = useCallStore()

const remoteAudioRef = ref()
const remoteVideoRef = ref()
const localVideoRef = ref()
const now = ref(Date.now())
let timer = null

const visible = computed(() => callStore.activeCallVisible)
const mediaType = computed(() => callStore.mediaType)
const peerUser = computed(() => callStore.peerUser)
const hasRemoteVideo = computed(() => !!callStore.remoteStream?.getVideoTracks?.().length)

const statusMap = {
  calling: 'Waiting for answer',
  accepting: 'Accepting call',
  connecting: 'Connecting',
  ended: 'Call ended',
  rejected: 'Call rejected',
  busy: 'Remote busy',
  timeout: 'Call timeout',
  failed: 'Call failed'
}

const statusText = computed(() => {
  if (callStore.status === 'in_call') {
    return 'In call'
  }
  return callStore.endedReason || callStore.errorMessage || statusMap[callStore.status] || ''
})

const durationText = computed(() => {
  if (callStore.status !== 'in_call' || !callStore.connectedAt) {
    return ''
  }
  const totalSeconds = Math.max(0, Math.floor((now.value - callStore.connectedAt) / 1000))
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
})

const bindStream = (targetRef, stream, muted = false) => {
  if (!targetRef.value) {
    return
  }
  targetRef.value.srcObject = stream || null
  targetRef.value.muted = muted
}

watch(
  () => callStore.localStream,
  (stream) => {
    bindStream(localVideoRef, stream, true)
  },
  { immediate: true }
)

watch(
  () => callStore.remoteStream,
  (stream) => {
    bindStream(remoteAudioRef, stream)
    bindStream(remoteVideoRef, stream)
  },
  { immediate: true }
)

watch(
  () => visible.value,
  (value) => {
    if (value && !timer) {
      timer = setInterval(() => {
        now.value = Date.now()
      }, 1000)
    }
    if (!value && timer) {
      clearInterval(timer)
      timer = null
    }
  },
  { immediate: true }
)

const toggleMuteHandler = () => {
  toggleMute()
}

const toggleCameraHandler = () => {
  toggleCamera()
}

const hangupHandler = () => {
  endCurrentCall()
}

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style lang="scss" scoped>
.call-panel {
  min-height: 420px;
  background: #111827;
  color: #fff;
  border-radius: 10px;
  overflow: hidden;
}

.voice-wrap {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;

  .nickname {
    font-size: 22px;
  }

  .status,
  .duration {
    color: rgba(255, 255, 255, 0.76);
  }
}

.remote-video-wrap {
  position: relative;
  height: 420px;
  background: #000;
}

.remote-video,
.local-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #1f2937;
}

.local-video {
  position: absolute;
  right: 16px;
  bottom: 16px;
  width: 160px;
  height: 120px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.8);

  .status {
    font-size: 14px;
  }
}

.toolbar {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 16px;
}

:deep(.call-dialog .el-dialog__header) {
  display: none;
}

:deep(.call-dialog .el-dialog__body) {
  padding: 0;
}
</style>
