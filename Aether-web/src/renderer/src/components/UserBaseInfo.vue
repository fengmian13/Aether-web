<template>
  <div class="user-panel" v-if="userInfo">
    <AvatarBase
      v-if="userInfo.userId || userInfo.contactId"
      :userId="userInfo?.userId || userInfo?.contactId || ''"
      :width="60"
      :borderRadius="5"
      :showDetail="true"
    >
    </AvatarBase>
    <div
      v-else
      class="avatar-placeholder"
      :style="{ width: '60px', height: '60px', 'border-radius': '5px' }"
    >
      <!-- 占位元素 -->
    </div>
    <div class="user-info">
      <div class="nick-name">
        {{ userInfo?.nickName || '' }}
        <span v-if="userInfo?.sex === 0" class="iconfont icon-woman"></span>
        <span v-if="userInfo?.sex === 1" class="icon-man"></span>
      </div>
      <div class="info">ID: {{ userInfo?.contactId || '' }}</div>
      <div class="info" v-if="showArea && userInfo?.areaName">
        地区:{{ proxy.Utils.getAreaInfo(userInfo?.areaName || '') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import AvatarBase from './AvatarBase.vue'
import { getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()

const props = defineProps({
  userInfo: {
    type: Object,
    default: () => ({
      userId: '',
      contactId: '',
      nickName: '',
      sex: -1, // 0: female, 1: male, -1: unknown
      areaName: ''
    })
  },
  showArea: {
    type: Boolean,
    default: true
  }
})
</script>

<style lang="scss" scoped>
.user-panel {
  display: flex;
  padding-bottom: 20px;
  .user-info {
    flex: 1;
    margin-left: 10px;
  }
  .nick-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #000000;
    font-size: 16px;
    .iconfont {
      font-size: 13px;
    }
    .icon-man {
      color: #2cb6fe;
    }
    .icon-woman {
      color: #fb7373;
    }
  }
  .info {
    font-size: 12px;
    color: #9e9e9e;
    margin-top: 3px;
  }
}
</style>