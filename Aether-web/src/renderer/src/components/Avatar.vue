<template>
  <div>
    <AvatarBase
      :userId="userId"
      :width="width"
      :borderRadius="borderRadius"
      :showDetail="false"
      v-if="userId == 'Urobot'"
    ></AvatarBase>
    <el-popover
      v-else
      :width="280"
      placement="right-start"
      :show-arrow="false"
      trigger="click"
      transition="none"
      :hide-after="0"
      @show="getContactInfo"
      ref="popoverRef"
    >
      <template #reference>
        <AvatarBase
          :userId="userId"
          :width="width"
          :borderRadius="borderRadius"
          :showDetail="false"
        ></AvatarBase>
      </template>
      <template #default>
        <div class="user-detail-container">
          <UserBaseInfo :userInfo="userInfo"></UserBaseInfo>
          <div class="op-btn" v-if="userId !== userInfoStore.getUserInfo().userId">
            <el-button v-if="userInfo.contactStatus == 1" type="primary" @click="sendMessage"
              >发送消息</el-button
            >
            <el-button v-else type="primary" @click="addContact">添加好友</el-button>
          </div>
        </div>
      </template>
    </el-popover>
  </div>
</template>

<script setup>
import UserBaseInfo from './UserBaseInfo.vue'
import AvatarBase from './AvatarBase.vue'
import { ref, reactive, getCurrentInstance, nextTick } from 'vue'
const { proxy } = getCurrentInstance()

import { useUserInfoStore } from '@/stores/UserInfoStore'
const userInfoStore = useUserInfoStore()

const props = defineProps({
  userId: {
    type: String,
    default: ''
  },
  width: {
    type: Number,
    default: 40
  },
  borderRadius: {
    type: Number,
    default: 0
  },
  groupId: {
    type: String
  }
})

const userInfo = ref({})
const getContactInfo = async () => {
  userInfo.value.userId = props.userId
  if (userInfoStore.getUserInfo().userId == props.userId) {
    userInfo.value = userInfoStore.getUserInfo()
  } else {
    let result = await proxy.Request({
      url: proxy.Api.getContactInfo,
      params: {
        contactId: props.userId
      },
      showLoading: false
    })
    if (!result) {
      return
    }
    userInfo.value = Object.assign({}, result.data)
  }
}

//TODO 发送消息
const sendMessage = () => {}
//TODO 添加好友
const addContact = () => {}
</script>

<style lang="scss" scoped>
.op-btn {
  text-align: center;
  border-top: 1px solid #eaeaea;
  padding: 10px;
}
</style>