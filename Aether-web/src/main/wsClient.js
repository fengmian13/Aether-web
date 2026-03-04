import WebSocket from 'ws'
const NODE_ENV = process.env.NODE_ENV

import store from "./store"

import { saveOrUpdateChatSessionBatch4Init, saveOrUpdate4Message, selectUserSessionByContactId } from "./db/ChatSessionUserModel"
import { updateContactNoReadCount } from "./db/UserSettingModel"
import { saveMessage, saveMessagebatch } from "./db/ChatMessageModel"

let ws = null;
let maxReConnectTimes = null;
let lockReconnect = false;
let wsUrl = null;
let sender = null;
let needReconnect = null;

const initWs = (config, _sender) => {
    wsUrl = `${NODE_ENV !== 'development' ? store.getData("prodWsDomain") : store.getData("devWsDomain")}?token=${config.token}`;
    sender = _sender;
    needReconnect = true;
    maxReConnectTimes = 5;
    createWs();
}

const createWs = () => {
    if (wsUrl == null) {
        return;
    }
    ws = new WebSocket(wsUrl);
    ws.onopen = function () {
        console.log("客户端-ws连接成功");
        ws.send("heart beat");
        maxReConnectTimes = 5;
    }
    // 从服务器接收到消息的回调函数
    ws.onmessage = async function (e) {
        console.log("服务器-ws返回数据：", e.data);
        const message = JSON.parse(e.data);
        const messageType = message.messageType;
        switch (messageType) {
            case 0://ws连接成功
                //保存会话消息
                await saveOrUpdateChatSessionBatch4Init(message.extendData.chatSessionList);
                //保存消息
                await saveMessagebatch(message.extendData.chatMessageList);
                //更新联系人申请数
                await updateContactNoReadCount({ userId: store.getUserId(), noReadCount: message.extendData.applyCount });
                //发送消息
                sender.send("reciveMessage:", { messageType: message.messageType })
                break;
            case 2:
                if (message.sendUserId == store.getUserId() && message.contactType == 1) {
                    break;
                }
                const sessionInfo = {}
                if (message.extendData && typeof message.extendData === "object") {
                    Object.assign(sessionInfo, message.extendData);
                } else {
                    Object.assign(sessionInfo, message);
                    if (message.contactType == 0 && messageType != 1) {
                        sessionInfo.contactName = message.sendUserNickName;
                    }
                    sessionInfo.lastReceiveTime = message.sendTime;
                }
                await saveOrUpdate4Message(store.getUserData("currentSessionId"), sessionInfo);
                //写入本地消息
                await saveMessage(message);
                const dbSessionInfo = await selectUserSessionByContactId(message.contactId);
                message.extendData = dbSessionInfo;
                sender.send("reciveMessage", message);
                break;
        }
    }
    ws.onclose = function () {
        console.log("客户端-ws连接关闭");
        reconnect();
    }
    ws.onerror = function () {
        console.log("客户端-ws连接错误");
        reconnect();
    }
    const reconnect = () => {
        if (!needReconnect) {
            console.log("连接断开--不需要重连");
            return;
        }
        if (ws != null) {
            ws.close();
        }
        if (lockReconnect) {
            return;
        }
        lockReconnect = true;
        if (maxReConnectTimes > 0) {
            console.log("正在重连，剩余重连次数：", maxReConnectTimes, new Date().getTime());
            maxReConnectTimes--;
            setTimeout(() => {
                createWs();
                lockReconnect = false;
            }, 5000);
        } else {
            console.log("连接超时");
        }
    }
    setInterval(() => {
        if (ws != null && ws.readyState == 1) {
            // console.log("发送心跳包");
            ws.send("heart beat");
        }
    }, 5000);
}

const closeWs = () => {
    needReconnect = false;
    ws.close();
}

export {
    initWs,
    closeWs
}
