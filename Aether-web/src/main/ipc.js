import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
const NODE_ENV = process.env.NODE_ENV
import store from './store'
import { log } from 'console'
import { initWs } from './wsClient'
import { addUserSetting } from './db/UserSettingModel'
import { selectUserSessionList, delChatSession, topChatSession, updateSessionInfo4Message, readAll, addChatSession, saveOrUpdate4Message } from './db/ChatSessionUserModel'
import { saveMessage, selectMessageList, updateMessage } from './db/ChatMessageModel'
import { saveFile2Local, createCover } from './file'

// 登录或注册
const onLoginOrRegister = (callback) => {
  ipcMain.on("loginOrRegister", (e, isLogin) => {
    callback(isLogin);
  })
}
//登录成功
const onLoginSuccess = (callback) => {
  ipcMain.on("openChat", (e, config) => {
    //输出日志
    console.log('验证码响应:', config)
    store.initUserId(config.userId);
    store.setUserData('token', config.token);
    // NOTE: 增加用户配置
    callback(config);
    addUserSetting(config.userId, config.email);
    // NOTE: 初始化ws连接
    initWs(config, e.sender);

  })
}

//窗口操作
const winTitleOp = (callback) => {
  ipcMain.on("winTitleOp", (e, data) => {
    callback(e, data);
    // console.log("测试界面按钮响应")
  })
}

const onSetLocalStore = () => {
  ipcMain.on("setLocalStore", (e, key, value) => {
    if (typeof key === 'object') {
      let data = key;
      key = data.key;
      value = data.value;
    }

    store.setData(key, value);
    //  console.log("Stored value for key:", key, store.getData(key));
  })
}

const onGetLocalStore = () => {
  ipcMain.on("getLocalStore", (e, key) => {
    console.log("收到渲染进程的获取事件key：", key);
    e.sender.send("getLocalStoreCallback", store.getData(key));
  })
}

//监听渲染端，查sql
const onLoadSessionData = () => {
  ipcMain.on("loadSessionData", async (e) => {
    // const dataList = []
    const result = await selectUserSessionList();
    e.sender.send("loadSessionDataCallback", result)
  })
}

const onAddChatSession = () => {
  ipcMain.on("addChatSession", (e, sessionInfo) => {
    addChatSession(sessionInfo);
  })
}

const onDelChatSession = () => {
  ipcMain.on("delChatSession", (e, contactId) => {
    delChatSession(contactId);
  })
}

const onTopChatSession = () => {
  ipcMain.on("topChatSession", (e, { contactId, topType }) => {
    topChatSession(contactId, topType);
  })
}

const onLoadChatMessage = () => {
  ipcMain.on("loadChatMessage", async (e, data) => {
    const result = await selectMessageList(data);
    e.sender.send("loadChatMessageCallback", result)
  })
}

const OnSetSessionSelect = () => {
  ipcMain.on("setSessionSelect", async (e, { contactId, sessionId }) => {
    if (sessionId) {
      store.setUserData("currentSessionId", sessionId)
      store.setUserData("currentContactId", contactId)
      readAll(contactId);//选中会话
    } else {
      store.deleteUserData("currentSessionId")
      store.deleteUserData("currentContactId")
    }
  })
};

const onAddlocalMessage = () => {
  ipcMain.on("addlocalMessage", async (e, data) => {
    await saveMessage(data);
    // NOTE 保存文件
    if (data.messageType == 5) {
      await saveFile2Local(data.messageId, data.filePath, data.fileType);
      const updateInfo = {
        status: 1
      }
      await updateMessage(updateInfo, { messageId: data.messageId });
    }
    //更新session
    data.lastReceiveTime = data.sendTime;
    // TODO 更新会话
    updateSessionInfo4Message(store.getUserData("currentSessionId"), data);
    e.sender.send("addLocalCallback", { status: 1, messageId: data.messageId });
  })
}

const onCreateCover = () => {
  ipcMain.on("createCover", async (e, localFilePath) => {
    const stream = await createCover(localFilePath);
    e.sender.send("createCoverCallback", stream);
  });
};

export {
  onLoginOrRegister,
  onLoginSuccess,
  winTitleOp,
  onSetLocalStore,
  onGetLocalStore,
  onLoadSessionData,
  onDelChatSession,
  onTopChatSession,
  onLoadChatMessage,
  onAddlocalMessage,
  OnSetSessionSelect,
  onCreateCover,
  onAddChatSession
}
