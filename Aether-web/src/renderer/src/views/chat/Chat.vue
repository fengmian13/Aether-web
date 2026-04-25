<template>
  <Layout>
    <template #left-content>
      <div class="drag-panel drag"></div>
      <div class="top-search">
        <el-input clearable placeholder="搜索" v-model="searchKey" size="small" @keyup="search">
          <template #suffix>
            <span class="iconfont icon-search"></span>
          </template>
        </el-input>
      </div>
      <div class="chat-session-list">
        <template v-for="item in chatSessionList">
          <ChatSession :data="item" @click="chatSessionClickHandler(item)"
            @contextmenu.stop="onContextMenu(item, $event)"
            :currentSession="item.contactId == currentChatSession.contactId">
          </ChatSession>
        </template>
      </div>
    </template>
    <template #right-content>
      <div class="title-panel drag" v-if="Object.keys(currentChatSession).length > 0">
        <div class="title">
          <span>{{ currentChatSession.contactName }}</span>
          <span v-if="currentChatSession.contactType == 1">
            ({{ currentChatSession.memberCount }})
          </span>
        </div>
      </div>
      <div v-if="currentChatSession.contactType == 1" class="iconfont icon-more no-drag" @click="showGroupDetail"></div>
      <div class="chat-panel" v-show="Object.keys(currentChatSession).length > 0">
        <div class="message-panel" id="message-panel">
          <div class="message-item" v-for="(data, index) in messageList" :id="'message' + data.messageId">

            <template v-if="
              index > 1 &&
              data.sendTime - messageList[index - 1].sendTime >= 300000 &&
              (data.messageType == 2 || data.messageType == 5)
            ">
              <ChatMessageTime :data="data"></ChatMessageTime>
            </template>
            <!-- 系统消息
                  3://群创建成功
                  1://添加好友成功
                  9://好友加入群组
                  11://退出群聊
                  12://踢出群聊 -->
            <template v-if="
              data.messageType == 3 ||
              data.messageType == 1 ||
              data.messageType == 9 ||
              data.messageType == 8 ||
              data.messageType == 11 ||
              data.messageType == 12
            ">
              <ChatMessageSys :data="data"></ChatMessageSys>
            </template>
            <template v-if="data.messageType == 1 || data.messageType == 2 || data.messageType == 5">
              <!-- 1:添加好友，2文本消息，5：媒体消息 -->
              <ChatMessage :data="data" :currentChatSession="currentChatSession"
                @showMediaDetail="showMediaDetailHandler"></ChatMessage>
            </template>
          </div>
        </div>
        <MessageSend :currentChatSession="currentChatSession" @sendMessage4Local="sendMessage4LocalHandler">
        </MessageSend>
      </div>
      <div class="chat-blank" v-show="Object.keys(currentChatSession).length == 0">
        <Blank></Blank>
      </div>
    </template>
  </Layout>
  <ChatGroupDetail ref="ChatGroupDetailRef"></ChatGroupDetail>
</template>

<script setup>
import ChatGroupDetail from './ChatGroupDetail.vue'
import Blank from '@/components/Blank.vue'
import ChatMessage from "./ChatMessage.vue"
import ChatMessageTime from "./ChatMessageTime.vue"
import ChatMessageSys from "./ChatMessageSys.vue"
import MessageSend from "./MessageSend.vue"
import ContextMenu from '@imengyu/vue3-context-menu'
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ChatSession from "./ChatSession.vue"
import { ref, reactive, getCurrentInstance, nextTick, onMounted, onUnmounted } from 'vue'
const { proxy } = getCurrentInstance()
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

const searchKey = ref();
const search = () => { }

const chatSessionList = ref([])

import { watch } from 'vue'

const setChatSessionByChatId = async (chatId) => {
  if (!chatId) {
    return
  }
  let session = chatSessionList.value.find((item) => {
    return item.contactId == chatId;
  });
  if (session) {
    chatSessionClickHandler(session);
  } else {
    // If not found, fetch contact details and add it temporarily to the list.
    let result = await proxy.Request({
      url: proxy.Api.getContactInfo,
      params: {
        contactId: chatId
      },
      showLoading: false
    });
    if (!result) {
      return;
    }

    // Construct dummy session based on contact info
    let newSession = {
      contactId: result.data.contactId || chatId,
      contactName: result.data.contactName || result.data.nickName,
      contactType: result.data.contactType || 0,
      sessionId: result.data.sessionId || 'TEMP',
      memberCount: result.data.memberCount || 0,
      lastMessage: '',
      lastReceiveTime: new Date().getTime(),
      topType: 0,
      status: 1
    };

    window.ipcRenderer.send('addChatSession', newSession);

    // Unshift puts it at the top
    chatSessionList.value.unshift(newSession);
    chatSessionClickHandler(newSession);
  }
}

watch(
  () => route.query.chatId,
  (newVal) => {
    setChatSessionByChatId(newVal);
  },
  { immediate: false, deep: true }
)

const loadChatSession = () => {
  window.ipcRenderer.send("loadSessionData");
}

//会话排序
const sortChatSessionList = (dataList) => {
  dataList.sort((a, b) => {
    const topTypeResult = b['topType'] - a['topType'];
    if (topTypeResult == 0) {
      return b['lastReceiveTime'] - a['lastReceiveTime']
    }
    return topTypeResult
  })
}

//删除会话
const delChatSessionList = (contactId) => {
  chatSessionList.value = chatSessionList.value.filter(item => {
    return item.contactId !== contactId
  })
}

//当前选中的会话
const currentChatSession = ref({})
const messageCountInfo = {
  totalPage: 0,
  pageNo: 0,
  maxMessageId: null,
  noData: false
};
let loadingChatMessage = false
let distanceBottom = 0
//点击会话
const messageList = ref([])
const chatSessionClickHandler = (item) => {
  distanceBottom = 0
  currentChatSession.value = Object.assign({}, item)
  //TODO 消息记录数要清空
  messageList.value = [];

  messageCountInfo.pageNo = 0
  messageCountInfo.totalPage = 1
  messageCountInfo.maxMessageId = null
  messageCountInfo.noData = false
  loadingChatMessage = false

  loadChatMessage();
  //设置选中session
  setSessionSelect(item.contactId, item.sessionId)
}

const setSessionSelect = (contactId, sessionId) => {
  window.ipcRenderer.send('setSessionSelect', {
    contactId,
    sessionId
  })
}

const loadChatMessage = () => {
  if (
    messageCountInfo.noData ||
    loadingChatMessage ||
    !currentChatSession.value.sessionId
  ) {
    return
  }
  loadingChatMessage = true
  messageCountInfo.pageNo++
  window.ipcRenderer.send("loadChatMessage", {
    sessionId: currentChatSession.value.sessionId,
    pageNo: messageCountInfo.pageNo,
    maxMessageId: messageCountInfo.maxMessageId
  })
}
const onRecivemessage = () => {
  window.ipcRenderer.on("reciveMessage", (e, message) => {
    console.log("收到消息：", message);

    if (message.messageType == 6) {
      const localMessage = messageList.value.find(item => {
        if (item.messageId == message.messageId) {
          return item;
        }
      })
      if (localMessage != null) {
        localMessage.status = 1
      }
      return
    }

    let curSession = chatSessionList.value.find((item) => {
      return item.contactId == message.contactId
    })
    if (curSession == null) {
      chatSessionList.value.push(message.extendData)
    } else {
      Object.assign(curSession, message.extendData)
    }
    sortChatSessionList(chatSessionList.value);
    if (message.contactId != currentChatSession.value.contactId) {
      // TODO 未读消息气泡展示
    } else {
      Object.assign(currentChatSession.value, message.extendData);
      const exists = messageList.value.some(item => String(item.messageId) === String(message.messageId));
      if (!exists) {
        messageList.value.push(message);
      }
      if (distanceBottom <= 60) {
        gotoBottom()
      }
    }
  })
}

const OnLoadSessionData = () => {
  window.ipcRenderer.on('loadSessionDataCallback', (e, dataList) => {
    // NOTE：会话排序
    sortChatSessionList(dataList);
    chatSessionList.value = dataList;
    setChatSessionByChatId(route.query.chatId);
  })
}

const OnLoadChatMessage = () => {
  window.ipcRenderer.on('loadChatMessageCallback', (e, { dataList, pageTotal, pageNo }) => {
    loadingChatMessage = false
    if (pageNo == pageTotal) {
      messageCountInfo.noData = true
    }
    dataList.sort((a, b) => {
      return a.messageId - b.messageId
    })
    const lastMessage = messageList.value[0]
    messageList.value = dataList.concat(messageList.value)
    messageCountInfo.pageNo = pageNo
    messageCountInfo.pageTotal = pageTotal
    if (pageNo == 1) {
      messageCountInfo.maxMessageId = dataList.length > 0 ? dataList[dataList.length - 1].messageId : null
      //  滚动条滚动到最底部
      gotoBottom()
    } else {
      nextTick(() => {
        document.querySelector('#message' + lastMessage.messageId).scrollIntoView()
      })
    }

  })
}

const onAddLoaclMessage = () => {
  window.ipcRenderer.on('addLocalCallback', (e, { messageId, status }) => {
    const findMessage = messageList.value.find((item) => {
      if (item.messageId == messageId) {
        return item
      }
    })
    if (findMessage != null) {
      findMessage.status = status
    }
  })
}

const sendMessage4LocalHandler = (messageObj) => {
  messageList.value.push(messageObj);
  // 发消息成功后，用服务端返回的真实 sessionId 同步更新本地会话
  const chatSession = chatSessionList.value.find(item => {
    return item.contactId == messageObj.contactId;
  })
  if (chatSession) {
    if (messageObj.sessionId) {
      chatSession.sessionId = messageObj.sessionId;
    }
    chatSession.lastMessage = messageObj.lastMessage;
    chatSession.lastReceiveTime = messageObj.sendTime;
  }
  // 同步更新 currentChatSession 的 sessionId（防止 TEMP 未被替换）
  if (messageObj.sessionId && currentChatSession.value.sessionId !== messageObj.sessionId) {
    currentChatSession.value.sessionId = messageObj.sessionId;
  }
  sortChatSessionList(chatSessionList.value)
  gotoBottom()
}
//滚动到底部
const gotoBottom = () => {
  nextTick(() => {
    //距离底部距离超过200就不自动滚动到底部
    if (distanceBottom > 200) {
      return
    }
    const items = document.querySelectorAll(".message-item")
    if (items.length > 0) {
      setTimeout(() => {
        items[items.length - 1].scrollIntoView();
      }, 100);
    }
  })
}
onMounted(() => {
  onRecivemessage()
  OnLoadSessionData()
  loadChatSession()
  OnLoadChatMessage()
  onAddLoaclMessage()

  nextTick(() => {
    const messagePanel = document.querySelector('#message-panel')
    messagePanel.addEventListener('scroll', (e) => {
      const scrollTop = e.target.scrollTop
      //计算距离底部的距离
      distanceBottom = e.target.scrollHeight - e.target.clientHeight - scrollTop
      //滚动到顶部，开始分页查询
      if (scrollTop <= 0 && messageList.value.length > 0) {
        loadChatMessage()
      }
    })
  })

})

//监听的销毁
onUnmounted(() => {
  window.ipcRenderer.removeAllListeners("loadSessionDataCallback");
  window.ipcRenderer.removeAllListeners("reciveMessage");
  window.ipcRenderer.removeAllListeners("loadChatMessageCallback");
  window.ipcRenderer.removeAllListeners("addLocalCallback");
})

//右键
const setTop = (data) => {
  data.topType = data.topType == 0 ? 1 : 0;
  // NOTE：会话排序
  sortChatSessionList(chatSessionList.value);
  window.ipcRenderer.send("topChatSession", { contactId: data.contactId, topType: data.topType });
}
const delChatSession = (contactId) => {
  //NOTE 从当前页面删除
  delChatSessionList(contactId);
  currentChatSession.value = {};
  //TODO:设置选中的会话
  window.ipcRenderer.send('delChatSession', contactId)
}
const onContextMenu = (data, e) => {
  ContextMenu.showContextMenu({
    x: e.x,
    y: e.y,
    items: [{
      label: data.topType == 0 ? "置顶" : "取消置顶",
      onClick: () => {
        setTop(data)
      }
    }, {
      label: '删除聊天',
      onClick: () => {
        proxy.Confirm({
          message: `确定要删除聊天【${data.contactName}吗？】`,
          okfun: () => {
            delChatSession(data.contactId)
          }
        })

      }
    }]
  })

}

//查看媒体详情
const showMediaDetailHandler = (messageId) => {
  let showFileList = messageList.value.filter((item) => {
    return item.messageType == 5
  })
  showFileList = showFileList.map((item) => {
    return {
      partType: 'chat',
      fileId: item.messageId,
      fileType: item.fileType,
      fileName: item.fileName,
      fileSize: item.fileSize,
      forceGet: false
    }
  })
  window.ipcRenderer.send('newWindow', {
    windowId: 'media',
    title: '图片查看',
    path: `/showMedia`,
    data: {
      currentFileId: messageId,
      fileList: showFileList
    }
  })
}


const searchClickHandler = (data) => {
  searchKey.value = undefined
  chatSessionClickHandler(data)
}

//群详情
const chatGroupDetailRef = ref()
const showGroupDetail = () => {
  chatGroupDetailRef.value.show(currentChatSession.value.contactId)
}
</script>

<style lang="scss" scoped>
.drag-panel {
  height: 25px;
  background: #f7f7f7;
}

.top-search {
  padding: 0px 10px 9px 10px;
  background: #f7f7f7;
  display: flex;
  align-items: center;

  .iconfont {
    font-size: 12px;
  }
}

.chat-session-list {
  height: calc(100vh - 62px);
  overflow: hidden;
  border-top: 1px solid#ddd;

  &:hover {
    overflow: auto;
  }
}

.search-list {
  height: calc(100vh - 62px);
  background: #f7f7f7;
  overflow: hidden;

  &:hover {
    overflow: auto;
  }
}

.title-panel {
  display: flex;
  align-items: center;

  .title {
    height: 60px;
    line-height: 60px;
    padding-left: 10px;
    font-size: 18px;
    color: #000000;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.icon-more {
  position: absolute;
  z-index: 1;
  top: 30px;
  right: 3px;
  width: 20px;
  font-size: 20px;
  margin-right: 5px;
  cursor: pointer;
}

.chat-panel {
  border-top: 1px solid#ddd;
  background: #f5f5f5;

  .message-panel {
    padding: 10px 30px 0px 30px;
    height: calc(100vh - 200px - 62px);
    overflow-y: auto;

    .message-item {
      margin-bottom: 15px;
      text-align: center;
    }
  }
}
</style>
