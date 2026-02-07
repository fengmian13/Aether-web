<template>
  <ContentPanel>
    <div class="user-info">
      <UserBaseInfo :userInfo="userInfo"></UserBaseInfo>
      <div class="more-op">
        <el-dropdown placement="bottom-end" trigger="click">
          <span class="el-dropdown-link">
            <span class="iconfont icon-more"></span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="addContact2BlackList">加入黑名单</el-dropdown-item>
              <el-dropdown-item @click="deleteContact">删除联系人</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="part-item">
        <div class="part-title">个性签名</div>
        <div class="part-content">{{ userInfo.personalSignature || '-' }}</div>
      </div>
      <div class="send-message" @click="sendMessage">
        <div class="iconfont icon-chat2"></div>
        <span>发送消息</span>
      </div>
      <div class="send-message" @click="callVideo">
        <div class="iconfont icon-video"></div>
        <span>视频通话</span>
      </div>
      <div class="send-message" @click="callVoice">
        <div class="iconfont icon-chat"></div>
        <span>语音通话</span>
      </div>
    </div>
  </ContentPanel>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick, watch } from 'vue'
const { proxy } = getCurrentInstance()
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

import { userContactStateStore } from '@/stores/ContactStateStore'
const contactStateStore = userContactStateStore()

const userInfo = ref({})
const loadUserDetail = async (contactId) => {
  let result = await proxy.Request({
    url: proxy.Api.getUserInfoByUserId,
    params: {
      userId: contactId
    }
  })
  if (!result) {
    return
  }
  userInfo.value = result.data
}

//加入黑名单
const addContact2BlackList = async () => {
  proxy.Confirm({
    message: '确定将此用户加入黑名单吗？',
    okfun: async () => {
      let result = await proxy.Request({
        url: proxy.Api.addContact2BlackList,
        params: {
          contactId: userInfo.value.userId
        }
      })
      if (!result) {
        return
      }
      delContactData()
    }
  })
}
// 删除联系人
const delContact = () => {
  proxy.Confirm({
    message: '确定删除此好友吗？',
    okfun: async () => {
      let result = await proxy.Request({
        url: proxy.Api.delContact,
        params: {
          contactId: userInfo.value.userId
        }
      })
      if (!result) {
        return
      }
      delContactData()
    }
  })
}

const delContactData = () => {
  contactStateStore.setContactReload('REMOVE_USER')
}

watch(
  () => route.query.contactId,
  (newVal, oldVal) => {
    if (newVal) {
      loadUserDetail(newVal)
    }
  },
  { immediate: true, deep: true }
)

const sendMessage = () => {
  // 消息发送逻辑
}

const callVideo = () => {
  // 视频通话逻辑
}

const callVoice = () => {
  // 语音通话逻辑
}
</script>

<style lang="scss" scoped>
.user-info {
  position: relative;
  padding: 20px;
  .more-op {
    position: absolute;
    right: 20px;
    top: 20px;
    cursor: pointer;
    z-index: 10;
    .iconfont {
      color: #9e9e9e;
      font-size: 20px;
      &:hover {
        color: #555;
      }
    }
  }
}

.part-item {
  display: flex;
  border-bottom: 1px solid #eaeaea;
  padding: 20px 0;
  .part-title {
    width: 60px;
    color: #9e9e9e;
  }
  .part-content {
    flex: 1;
    margin-left: 15px;
    color: #161616;
  }
}

.send-message {
  width: 140px;
  height: 36px;
  background: #409eff;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  color: #fff;
  margin: 0 auto;
  margin-top: 50px;
  cursor: pointer;
  transition: all 0.3s;
  .iconfont {
    font-size: 20px;
    margin-right: 5px;
  }
  span {
    font-size: 14px;
  }
  &:hover {
    background: #66b1ff;
  }
}
</style>