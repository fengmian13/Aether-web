<template>
  <div class="main">
    <div class="left-sider">
      <div></div>
      <div class="menu-list">
        <template v-for="item in menuList" :key="item.name">
          <div
            :class="['tab-item iconfont', item.icon, item.path == currentMenu.path ? 'active' : '']"
            v-if="item.position === 'top'"
            @click="changeMenu(item)"
          >
            <template v-if="item.name == 'chat'"> </template>
          </div>
        </template>
      </div>
      <div class="menu-list menu-bottom">
        <template v-for="item in menuList" :key="item.name">
          <div
            :class="['tab-item iconfont', item.icon, item.path == currentMenu.path ? 'active' : '']"
            v-if="item.position === 'bottom'"
            @click="changeMenu(item)"
          ></div>
        </template>
      </div>
    </div>
    <div class="right-container">
      <router-view v-slot="{ Component }">
        <keep-alive include="chat">
          <component :is="Component" ref="componentRef"></component>
        </keep-alive>
      </router-view>
    </div>
  </div>
  <winOp></winOp>
</template>

<script setup>
// import { ref } from 'vue'
// import { useRouter } from 'vue-router'
import { ref, reactive, getCurrentInstance, nextTick, onMounted } from 'vue'
const { proxy } = getCurrentInstance()
import { useRouter } from 'vue-router'
const router = useRouter()

import { useUserInfoStore } from '@/stores/UserInfoStore'
const userInfoStore = useUserInfoStore()

const menuList = ref([
  {
    name: 'chat',
    icon: 'icon-chat', // 修正了这里的拼写错误
    path: '/chat',
    countKey: 'chatCount',
    position: 'top'
  },
  {
    name: 'contact',
    icon: 'icon-user',
    path: '/contact',
    countKey: 'contactApplyCount',
    position: 'top'
  },
  {
    name: 'mysetting',
    icon: 'icon-more2',
    path: '/setting',
    position: 'bottom'
  }
])

const currentMenu = ref(menuList.value[0])
const changeMenu = (item) => {
  currentMenu.value = item
  router.push(item.path)
}

const getLoginInfo = async () => {
  let result = await proxy.Request({
    url: proxy.Api.getUserInfo
  })
  if (!result) {
    return
  }
  userInfoStore.setUserInfo(result.data)
}
onMounted(() => {
  getLoginInfo()
})
</script>



<style lang="scss" scoped>
.main {
  background: #ddd;
  display: flex;
  border-radius: 0px 3px 3px 0px;
  overflow: hidden;
  height: 100vh;
}

.left-sider {
  width: 55px;
  background: #2e2e2e;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 35px;
  border: 1px solid #2e2e2e;
  border-right: none;
  padding-bottom: 10px;

  .avatar-panel {
    width: 35px;
    height: 35px;
    margin-bottom: 15px;
    border-radius: 3px;
    overflow: hidden;

    .avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: #444;
      color: #aaa;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
  }
}

.menu-list {
  width: 100%;
  flex: 1; /* 让上方的菜单列表占据剩余空间，从而挤压下方菜单到底部 */
}

.tab-item {
  color: #d3d3d3;
  font-size: 20px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  cursor: pointer;
  font-size: 22px;
  position: relative;

  &:hover {
    color: #fff;
  }
}

.tab-item.active {
  color: #07c160;
}

.menu-bottom {
  /* 关键修改：设置为 flex: 0，不参与剩余空间分配，只占据自身内容高度 */
  flex: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.right-container {
  flex: 1;
  overflow: hidden;
  border: 1px solid #ddd;
  border-left: none;
  background-color: #f5f5f5;
}
</style>