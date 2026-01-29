<template>
  <div class="contact-layout">
    <!-- 左侧区域：列表与搜索 -->
    <div class="left-panel">
      <!-- 搜索框区域 -->
      <div class="top-search">
        <div class="search-box">
          <i class="iconfont icon-search"></i>
          <input type="text" placeholder="搜索" v-model="searchKey" @keyup.enter="search" />
          <i v-if="searchKey" class="iconfont icon-close" @click="searchKey = ''"></i>
        </div>
      </div>

      <!-- 列表区域 -->
      <div class="contact-list">
        <template v-for="item in partList" :key="item.partName">
          <div class="part-title">{{ item.partName }}</div>

          <div class="part-group">
            <!-- 1. 渲染固定菜单 (如：新朋友、群聊) -->
            <div
              v-for="sub in item.children"
              :key="sub.path || sub.name"
              :class="['part-item', sub.path === route.path ? 'active' : '']"
              @click="handleMenuClick(sub)"
            >
              <div class="icon-box" :style="{ background: sub.iconBgColor }">
                <span :class="['iconfont', sub.icon]"></span>
              </div>
              <div class="text">{{ sub.name }}</div>
            </div>

            <!-- 2. 渲染动态数据 (如：好友列表、群组列表) -->
            <div
              v-for="contact in item.contactData"
              :key="contact[item.contactId] || contact.id"
              :class="['part-item', isActiveContact(contact, item) ? 'active' : '']"
              @click="handleContactClick(contact, item)"
            >
              <!-- 头像 -->
              <div class="avatar-box">
                {{ (contact[item.contactName] || contact.name || 'U').substring(0, 1) }}
              </div>

              <!-- 文本区域：根据是否是好友列表进行不同渲染 -->
              <div class="text-container">
                <div class="main-text">
                  {{ contact[item.contactName] || contact.name }}

                  <!-- 特殊展示：如果是好友列表，显示性别图标 -->
                  <span
                    v-if="item.partName === '我的好友'"
                    class="sex-icon"
                    :class="contact.sex == 1 ? 'man' : 'woman'"
                  >
                    <!-- 这里用简单的字符或颜色区分，实际可用 iconfont -->
                    <i :class="['iconfont', contact.sex == 1 ? 'icon-man' : 'icon-woman']"></i>
                  </span>
                </div>

                <!-- 特殊展示：如果是好友列表，显示状态 -->
                <div v-if="item.partName === '我的好友'" class="sub-text">
                  {{ getStatusText(contact.status) }}
                </div>
              </div>
            </div>

            <!-- 3. 空状态 -->
            <div
              v-if="
                (!item.children || item.children.length === 0) &&
                (!item.contactData || item.contactData.length === 0)
              "
              class="no-data"
            >
              {{ item.emptyMsg }}
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 右侧区域：详情与路由出口 -->
    <div class="right-panel">
      <div class="title-panel" v-if="rightTitle">{{ rightTitle }}</div>

      <div class="content-view">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const { proxy } = getCurrentInstance()
const router = useRouter()
const route = useRoute()

const searchKey = ref('')
const rightTitle = ref('')

const search = () => {
  console.log('正在搜索:', searchKey.value)
  // TODO: 搜索逻辑
}

// 状态枚举转换工具函数
const getStatusText = (status) => {
  const statusMap = {
    1: '好友',
    2: '已删除好友',
    3: '已拉黑好友'
  }
  return statusMap[status] || '未知状态'
}

// 菜单数据结构
const partList = reactive([
  {
    partName: '新朋友',
    children: [
      {
        name: '搜好友',
        icon: 'icon-search',
        iconBgColor: '#fa9d3b',
        path: '/contact/search',
        showTitle: false
      },
      {
        name: '新的朋友',
        icon: 'icon-plane',
        iconBgColor: '#08bf61',
        path: '/contact/contactNotice',
        showTitle: true,
        countKey: 'contactApplyCount'
      }
    ],
    contactData: []
  },
  {
    partName: '我的群聊',
    children: [
      {
        name: '新建群聊',
        icon: 'icon-add-group',
        iconBgColor: '#1485ee',
        path: '/contact/createGroup',
        showTitle: true
      }
    ],
    contactId: 'groupId',
    contactName: 'groupName',
    contactPath: '/contact/groupDetail',
    contactData: []
  },
  {
    partName: '我加入的群聊',
    contactId: 'contactId',
    contactName: 'contactName',
    contactPath: '/contact/groupDetail',
    emptyMsg: '暂未加入群聊',
    children: [],
    contactData: []
  },
  {
    partName: '我的好友',
    contactId: 'contactId',
    // 核心修改：接口返回的是 nickName，这里做映射修改
    contactName: 'nickName',
    contactPath: '/contact/userDetail',
    emptyMsg: '暂无好友',
    children: [],
    contactData: []
  }
])

const handleMenuClick = (sub) => {
  if (sub.showTitle) {
    rightTitle.value = sub.name
  } else {
    rightTitle.value = ''
  }
  router.push(sub.path)
}

const handleContactClick = (contact, item) => {
  const name = contact[item.contactName] || contact.name
  rightTitle.value = name

  const id = contact[item.contactId]

  router.push({
    path: item.contactPath,
    query: { id: id }
  })
}

const isActiveContact = (contact, item) => {
  const currentId = route.query.id
  const itemId = contact[item.contactId]
  return route.path === item.contactPath && currentId === itemId
}

// 获取好友列表
const loadContact = async () => {
  let result = await proxy.Request({
    url: proxy.Api.loadContactUser
  })
  if (!result) {
    return
  }
  // 将接口数据赋值给“我的好友”部分的 contactData
  // partList[3] 对应的是 '我的好友'
  partList[3].contactData = result.data
}

onMounted(() => {
  loadContact()
})
</script>

<style lang="scss" scoped>
/* 整体布局容器：左右结构 */
.contact-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: #f5f5f5;
  overflow: hidden;
}

.left-panel {
  width: 250px;
  background-color: #fff;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
}

.top-search {
  padding: 12px;
  background-color: #f7f7f7;
  border-bottom: 1px solid #eee;
}

.search-box {
  display: flex;
  align-items: center;
  background: #e2e2e2;
  border-radius: 4px;
  padding: 4px 8px;
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 12px;
  flex: 1;
  margin-left: 5px;
  height: 24px;
}

/* 列表滚动区域 */
.contact-list {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.part-title {
  padding: 10px 12px;
  font-size: 12px;
  color: #999;
  background-color: #fafafa;
}

.part-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  height: 60px; /* 稍微增加高度以容纳状态文字 */
}

.part-item:hover {
  background-color: #f0f0f0;
}

.part-item.active {
  background-color: #cce9ff;
}

/* 图标与头像样式 */
.icon-box,
.avatar-box {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  flex-shrink: 0;
}

.avatar-box {
  background-color: #409eff;
}

/* 文本容器改为列式布局，以便显示状态 */
.text-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 之前的 .text 样式适配 */
.text,
.main-text {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-text {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.sex-icon {
  margin-left: 5px;
  font-size: 12px;
}

.sex-icon.man {
  color: #409eff;
}

.sex-icon.woman {
  color: #ff6b81;
}

/* 为了兼容之前的纯文本模式（左侧菜单固定项），保留 text 类名样式 */
.text {
  line-height: 40px;
}

.no-data {
  text-align: center;
  color: #ccc;
  font-size: 12px;
  padding: 20px 0;
}

.right-panel {
  flex: 1;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  position: relative;
}

.title-panel {
  height: 50px;
  line-height: 50px;
  padding: 0 20px;
  border-bottom: 1px solid #ddd;
  background-color: #fff;
  font-size: 16px;
  font-weight: 500;
}

.content-view {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.iconfont {
  font-size: 14px;
}

/* 模拟性别图标，实际项目中请确保引入了对应的 iconfont */
.icon-man:before {
  content: '♂';
}
.icon-woman:before {
  content: '♀';
}
</style>