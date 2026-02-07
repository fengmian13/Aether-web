<template>
  <ContentPanel>
    <div class="group-info-item">
      <div class="group-title">封面</div>
      <div class="group-value">
        <Avatar :userId="groupInfo.groupId"></Avatar>
        <!-- <div style="font-size: 10px; color: red">
          DEBUG: groupOwnerId={{ groupInfo.groupOwnerId }} | userId={{
            userInfoStore.userInfo?.userId
          }}
        </div> -->
      </div>
      <el-dropdown placement="bottom-end" trigger="click">
        <span class="el-dropdown-link">
          <div class="iconfont icon-more"></div>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-if="groupInfo.groupOwnerId == userInfoStore.userInfo.userId"
              @click="editGroupInfo"
              >修改群信息</el-dropdown-item
            >
            <el-dropdown-item
              v-if="groupInfo.groupOwnerId == userInfoStore.userInfo.userId"
              @click="dissolutionGroup"
              >解散群组</el-dropdown-item
            >
            <el-dropdown-item v-else @click="leaveGroup">退出群组</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="group-info-item">
      <div class="group-title">群ID：</div>
      <div class="group-value">{{ groupInfo.groupId }}</div>
    </div>
    <div class="group-info-item">
      <div class="group-title">群名称：</div>
      <div class="group-value">{{ groupInfo.groupName }}</div>
    </div>
    <div class="group-info-item">
      <div class="group-title">加入权限：</div>
      <div class="group-value">{{ groupInfo.joinType == '0' ? '需要验证' : '允许任何人加入' }}</div>
    </div>
    <div class="group-info-item">
      <div class="group-title">群公告：</div>
      <div class="group-value">{{ groupInfo.groupIntroducte }}</div>
    </div>
    <div class="group-info-item">
      <div class="group-title"></div>
      <div class="group-value">
        <el-button type="primary" @click="sendMessage">发送消息</el-button>
      </div>
    </div>
    <GroupEditDialog ref="groupEditDialogRef" @reloadGroupInfo="getGroupInfo"></GroupEditDialog>
  </ContentPanel>
</template>

<script setup>
import GroupEditDialog from './GroupEditDialog.vue'
import { ref, reactive, getCurrentInstance, nextTick, watch } from 'vue'
const { proxy } = getCurrentInstance()
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

import { useUserInfoStore } from '@/stores/UserInfoStore'
const userInfoStore = useUserInfoStore()
import { userContactStateStore } from '@/stores/ContactStateStore'
const contactStateStore = userContactStateStore()

const groupInfo = ref({})
const groupId = ref()

const getGroupInfo = async () => {
  let result = await proxy.Request({
    url: proxy.Api.getGroupInfo,
    params: {
      groupId: groupId.value
    }
  })
  if (!result) {
    return
  }
  groupInfo.value = result.data
}

watch(
  () => route.query.contactId,
  (newVal, oldVal) => {
    if (newVal) {
      groupId.value = newVal
      getGroupInfo()
    }
  },
  { immediate: true, deep: true }
)

const sendMessage = () => {
  // TODO: Implement send message
}

const groupEditDialogRef = ref()
const editGroupInfo = () => {
  groupEditDialogRef.value.show(groupInfo.value)
}

const dissolutionGroup = () => {
  // TODO
}

const quitGroup = () => {
  // TODO
}
</script>

<style lang="scss" scoped>
.group-info-item {
  display: flex;
  margin: 15px 0px;
  align-items: center;
  .group-title {
    width: 100px;
    text-align: right;
  }
  .group-value {
    flex: 1;
  }
}
.notice {
  align-items: flex-start;
}
</style>        