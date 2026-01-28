<template>
  <ContentPanel>
    <div class="search-form">
      <el-input
        clearable
        placeholder="请输入用户ID或群组ID"
        v-model="contactId"
        size="large"
        @keyup.enter="search"
      ></el-input>
      <div class="search-btn iconfont icon-search" @click="search"></div>
    </div>
    <div v-if="searchResult && Object.keys(searchResult).length > 0" class="search-result-panel">
      <div class="search-result">
        <span class="contact-type">{{ contactTypeName }}</span>
        <UserBaseInfo
          :userInfo="searchResult"
          :showArea="searchResult.contactType == 'USER'"
        ></UserBaseInfo>
      </div>
      <div class="op-btn" v-if="searchResult.contactId != userInfoStore.getUserInfo().userId">
        <el-button
          type="primary"
          v-if="
            searchResult.status == null ||
            searchResult.status == 0 ||
            searchResult.status == 2 ||
            searchResult.status == 3 ||
            searchResult.status == 4
          "
          @click="applyContact"
          >{{ searchResult.contactType == 'USER' ? '申请加好友' : '申请加群' }}</el-button
        >
        <el-button type="primary" v-else-if="searchResult.status == 1" @click="sendMessage"
          >发送消息</el-button
        >
        <span v-if="searchResult.status == 5 || searchResult.status == 6">你已被拉黑</span>
      </div>
    </div>
    <div v-else class="no-data">没有搜索到结果</div>
  </ContentPanel>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick, computed } from 'vue'
const { proxy } = getCurrentInstance()
import { useUserInfoStore } from '@/stores/UserInfoStore'
const userInfoStore = useUserInfoStore()

const contactTypeName = computed(() => {
  //   console.log(userInfoStore.getUserInfo().userId)
  if (userInfoStore.getUserInfo().userId == searchResult.value.contactId) {
    return '自己'
  }
  if (searchResult.value.contactType == 'USER') {
    return '用户'
  }
  if (searchResult.value.contactType == 'GROUP') {
    return '群组'
  }
})

const contactId = ref()
const searchResult = ref({})
const search = async () => {
  //校验输入
  if (!contactId.value) {
    proxy.Message.warning('请输入用户ID或群组ID')
    return
  }

  let result = await proxy.Request({
    url: proxy.Api.search,
    params: {
      contactId: contactId.value
    }
  })
  if (!result) {
    return
  }
  searchResult.value = result.data
}

const applyContact = () => {}
</script>

<style lang="scss" scoped>
.search-form {
  padding-top: 50px;
  display: flex;
  align-items: center;

  :deep(.el-input__wrapper) {
    border-radius: 4px 0px 0px 4px;
    border-right: none;
  }

  .search-btn {
    background: #07c160;
    color: #fff;
    line-height: 40px;
    width: 80px;
    text-align: center;
    border-radius: 0px 5px 5px 0px;
    cursor: pointer;

    &:hover {
      background: #0dd36c;
    }
  }
}

.no-data {
  padding: 30px 0px; // 将'Opx'更改为'0px'
}

.search-result-panel {
  .search-result {
    padding: 30px 20px 20px 20px;
    background: #fff;
    border-radius: 5px;
    margin-top: 10px;
    position: relative;

    .contact-type {
      position: absolute;
      left: 0px; // 将'Opx'更改为'0px'
      top: 0px; // 将'Opx'更改为'0px'
      background: #2cb6fe;
      padding: 2px 5px;
      color: #fff;
      border-radius: 5px 0px 0px 0px; // 将'Opx'更改为'0px'
      font-size: 12px;
    }
  }

  .op-btn {
    border-radius: 5px;
    margin-top: 10px;
    padding: 10px;
    background: #fff;
    text-align: center;
  }
}
</style>