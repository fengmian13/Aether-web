<template>
  <el-dialog
    :model-value="visible"
    width="320px"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="incoming-call-dialog"
    align-center
  >
    <div class="incoming-call">
      <Avatar :userId="peerUser.userId" :width="72" :showDetail="false"></Avatar>
      <div class="nickname">{{ peerUser.nickName || peerUser.userId }}</div>
      <div class="desc">{{ mediaType === 'video' ? 'Incoming video call' : 'Incoming voice call' }}</div>
      <div class="actions">
        <el-button @click="reject">Reject</el-button>
        <el-button type="primary" @click="accept">Accept</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useCallStore } from '@/stores/CallStore'
import { acceptIncomingCall, rejectIncomingCall } from '@/services/call/callService'

const callStore = useCallStore()

const visible = computed(() => callStore.status === 'ringing' && !!callStore.pendingIncomingCall)
const peerUser = computed(() => callStore.peerUser)
const mediaType = computed(() => callStore.mediaType)

const accept = () => {
  acceptIncomingCall()
}

const reject = () => {
  rejectIncomingCall()
}
</script>

<style lang="scss" scoped>
.incoming-call {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 8px 0;

  .nickname {
    font-size: 18px;
    color: #303133;
  }

  .desc {
    color: #909399;
    font-size: 14px;
  }

  .actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }
}

:deep(.incoming-call-dialog .el-dialog__header) {
  display: none;
}

:deep(.incoming-call-dialog .el-dialog__body) {
  padding-top: 24px;
}
</style>
