import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
const NODE_ENV = process.env.NODE_ENV
import store from './store'
import { log } from 'console'

// 登录或注册
const onLoginOrRegister = (callback) => { 
    ipcMain.on("loginOrRegister", (e, isLogin)=>{ 
    callback(isLogin);
  })
}
//登录成功
const onLoginSuccess = (callback) => { 
    ipcMain.on("openChat", (e, config)=>{ 
    //输出日志
    console.log('验证码响应:', config)
    store.initUserId(config.userId);
    store.setUserData('token', config.token);
    // TODO 增加用户配置
    callback(config);
    // TODO 初始化ws连接
  })
}

export{
    onLoginOrRegister,
    onLoginSuccess
}
