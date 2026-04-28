import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
const NODE_ENV = process.env.NODE_ENV
import store from './store'
import { initWs, closeWs } from './wsClient'
import { addUserSetting, getCurrentUserSetting, updateCurrentUserFileFolder } from './db/UserSettingModel'
import { selectUserSessionList, delChatSession, topChatSession, updateSessionInfo4Message, readAll, addChatSession, saveOrUpdate4Message } from './db/ChatSessionUserModel'
import { saveMessage, selectMessageList, updateMessage } from './db/ChatMessageModel'
import { saveFile2Local, createCover, saveAvatar2Local, saveAs, saveClipBoardFile, closeLocalServer, selectLocalFolder, openLocalFolder } from './file'
import { saveWindow, getWindow, delWindow, windowManage } from './windowProxy'

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

//重新登录
const onReLogin = (callback) => {
  ipcMain.on("reLogin", (e, data) => {
    for (let win in windowManage) {
      if (win !== "main") {
        windowManage[win].close();
      }
    }
    callback();
    e.sender.send("reLogin")
    closeWs();
    closeLocalServer();
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

const onSaveAvatar2Local = () => {
  ipcMain.on("saveAvatar2Local", async (e, data) => {
    await saveAvatar2Local(data);
    e.sender.send("saveAvatar2LocalCallback", { success: true, userId: data.userId });
  });
}

const onOpenNewWindow = () => {
  ipcMain.on("newWindow", (e, config) => {
    openWindow(config);
  })
}

const onSaveAs = () => {
  ipcMain.on("saveAs", async (e, data) => {
    saveAs(data);
  });
}

//读取剪切板内容
const onSaveClipBoardFile = () => {
  ipcMain.on("saveClipBoardFile", async (e, file) => {
    const result = await saveClipBoardFile(file);
    console.log("result", result);
    e.sender.send("saveClipBoardFileCallback", result);
  });
}

const onGetFileManageInfo = () => {
  ipcMain.on("getFileManageInfo", async (e) => {
    const result = await getCurrentUserSetting();
    e.sender.send("getFileManageInfoCallback", result);
  });
}

const onChangeLocalFolder = () => {
  ipcMain.on("changeLocalFolder", async (e) => {
    const selectedFolder = await selectLocalFolder();
    if (!selectedFolder) {
      e.sender.send("changeLocalFolderCallback", { canceled: true });
      return;
    }
    const result = await updateCurrentUserFileFolder(selectedFolder);
    e.sender.send("changeLocalFolderCallback", {
      canceled: false,
      ...result
    });
  });
}

const onOpenLocalFolder = () => {
  ipcMain.on("openLocalFolder", async (e) => {
    const setting = await getCurrentUserSetting();
    const errorMessage = await openLocalFolder(setting?.currentFolder);
    e.sender.send("openLocalFolderCallback", {
      success: !errorMessage,
      errorMessage
    });
  });
}

const openWindow = ({ windowId, title = "Ather", path, width = 960, height = 720, data }) => {
  const localServerPort = store.getUserData("localServerPort");
  data.localServerPort = localServerPort;
  let newWindow = getWindow(windowId);
  if (!newWindow) {
    newWindow = new BrowserWindow({
      icon: icon,
      width: width,
      height: height,//380
      fullscreenable: false,
      fullscreen: false,
      maximizable: false,
      autoHideMenuBar: true,
      resizable: true,
      titleBarStyle: 'hidden',
      frame: true,
      transparent: true,
      hasShadow: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: false
      }
    })
    //保存窗口
    saveWindow(windowId, newWindow);

    newWindow.setMinimumSize(600, 484);
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      // newWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + "#" + path)
      newWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/index.html#${path}`);
    } else {
      newWindow.loadFile(join(__dirname, `../renderer/index.html`), { hash: `${path}` });
    }
    //打开调试窗口
    // if (NODE_ENV === 'development') {
    //   newWindow.webContents.openDevTools();
    // }

    newWindow.on('ready-to-show', () => {
      console.log("设置title", title);
      newWindow.setTitle(title);
      newWindow.show()
    })

    newWindow.once('show', () => {
      setTimeout(() => {
        newWindow.webContents.send('pageInitData', data);
      }, 500);
    })
    newWindow.on('closed', () => {
      console.log("关闭窗口");
      delWindow(windowId);
    })
  } else {
    newWindow.show();
    newWindow.setSkipTaskbar(false)
    newWindow.webContents.send('pageInitData', data);
  }
}

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
  onSaveAvatar2Local,
  onAddChatSession,
  onOpenNewWindow,
  onSaveAs,
  onSaveClipBoardFile,
  onReLogin,
  onGetFileManageInfo,
  onChangeLocalFolder,
  onOpenLocalFolder
}
