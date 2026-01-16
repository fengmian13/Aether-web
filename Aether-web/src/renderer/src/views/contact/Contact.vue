<template>
  <div class="contact-layout">
    <!-- 左侧区域：列表与搜索 -->
    <div class="left-panel">
      <div class="drag-panel drag"></div>
      <div class="top-search">
        <!-- 搜索框 (如果未安装 Element Plus，这里可能需要调整) -->
        <el-input clearable placeholder="搜索" v-model="searchKey" size="small" @keyup="search">
          <template #prefix>
            <span class="iconfont icon-search"></span>
          </template>
        </el-input>
      </div>

      <div class="contact-list">
        <template v-for="item in partList" :key="item.partName">
          <div class="part-title">{{ item.partName }}</div>
          <div class="part-list">
            <div
              v-for="sub in item.children"
              :key="sub.path || sub.name"
              :class="['part-item', sub.path == route.path ? 'active' : '']"
              @click="partJump(sub)"
            >
              <div :class="['iconfont', sub.icon]" :style="{ background: sub.iconBgColor }"></div>
              <div class="text">{{ sub.name }}</div>
            </div>

            <!-- 你的好友/群聊数据渲染逻辑 (保留原样) -->
            <template
              v-for="contact in item.contactData"
              :key="contact.id || contact.name || contact.path"
            >
              <!-- 实际 contact 数据渲染 -->
            </template>

            <template v-if="item.contactData && item.contactData.length == 0">
              <div class="no-data">
                {{ item.emptyMsg }}
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>

    <!-- 右侧区域：详情与路由出口 -->
    <div class="right-panel">
      <div class="title-panel drag">{{ rightTitle }}</div>

      <!-- 核心修复：router-view 放置在这里 -->
      <div class="content-view">
        <router-view v-slot="{ Component }">
          <component :is="Component" ref="componentRef"> </component>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const { proxy } = getCurrentInstance()
const router = useRouter()
const route = useRoute()

const searchKey = ref('')

const search = () => {
  // 搜索逻辑
  console.log('searching...', searchKey.value)
}

const rightTitle = ref()
const partJump = (data) => {
  if (data.showTitle) {
    rightTitle.value = data.name
  } else {
    rightTitle.value = null
  }
  //TODO 处理联系人好友申请 数量已读
  router.push(data.path)
}

// 菜单数据
const partList = ref([
  {
    partName: '新朋友',
    children: [
      {
        name: '搜好友',
        icon: 'icon-search',
        iconBgColor: '#fa9d3b',
        path: '/contact/search'
      },
      {
        name: '新的朋友',
        icon: 'icon-plane',
        iconBgColor: '#08bf61',
        path: '/contact/contactNotice',
        showTitle: true,
        countKey: 'contactApplyCount'
      }
    ]
  },
  {
    partName: '我的群聊',
    children: [
      {
        name: '新建群聊',
        icon: 'icon-add-group',
        iconBgColor: '#1485ee',
        path: '/contact/createGroup'
      }
    ],
    contactId: 'groupId',
    contactName: 'groupName',
    showTitle: true,
    contactData: [],
    contactPath: '/contact/groupDetail'
  },
  {
    partName: '我加入的群聊',
    contactId: 'contactId',
    contactName: 'contactName',
    showTitle: true,
    contactData: [],
    contactPath: '/contact/groupDetail',
    emptyMsg: '暂未加入群聊'
  },
  {
    partName: '我的好友',
    children: [],
    contactId: 'contactId',
    contactName: 'contactName',
    contactData: [],
    contactPath: '/contact/userDetail',
    emptyMsg: '暂无好友'
  }
])
</script>

<style lang="scss" scoped>
/* 整体布局容器：左右结构 */
.contact-layout {
  display: flex;
  width: 100%;
  height: 100%; /* 继承父容器高度 */
  overflow: hidden;
}

/* 左侧面板样式 */
.left-panel {
  width: 250px; /* 固定宽度 */
  background: #f7f7f7;
  border-right: 1px solid #d6d6d6;
  display: flex;
  flex-direction: column;
}

/* 右侧面板样式 */
.right-panel {
  flex: 1; /* 占据剩余空间 */
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  position: relative; /* 为子元素定位提供参照 */
}

/* 内容区域，router-view 的容器 */
.content-view {
  flex: 1;
  overflow: auto;
  position: relative;
}
.drag-panel {
  height: 25px;
  background: #f7f7f7;
}
.top-search {
  padding: 0px 10px 9px 10px;
  background: #f7f7f7;
  display: flex;
  align-items: center;
  /* 修复 input 样式问题 */
  :deep(.el-input__wrapper) {
    border-radius: 4px;
  }
  .iconfont {
    font-size: 12px;
  }
}

.contact-list {
  border-top: 1px solid #ddd;
  flex: 1; /* 让列表占据左侧剩余高度 */
  overflow-y: auto; /* 允许滚动 */

  &:hover {
    overflow-y: auto;
  }
  .part-title {
    color: #515151;
    padding-left: 10px;
    margin-top: 10px;
  }
  .part-list {
    border-bottom: 1px solid #d6d6d6;
    .part-item {
      display: flex;
      align-items: center;
      padding: 10px 10px;
      position: relative;
      &:hover {
        cursor: pointer;
        background: #d6d6d7;
      }
      .iconfont {
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: #fff;
        border-radius: 4px;
      }
      .text {
        flex: 1;
        color: #000000;
        margin-left: 10px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    .no-data {
      text-align: center;
      font-size: 12px;
      color: #9d9d9d;
      line-height: 30px;
    }
    .active {
      background: #c4c4c4;
      &:hover {
        background: #c4c4c4;
      }
    }
  }
}

.title-panel {
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  padding-left: 20px; /* 稍微增加一点左边距 */
  font-size: 18px;
  color: #000000;
  border-bottom: 1px solid #e7e7e7; /* 增加底部边框，区分标题和内容 */
  flex-shrink: 0; /* 防止被压缩 */
}
</style>