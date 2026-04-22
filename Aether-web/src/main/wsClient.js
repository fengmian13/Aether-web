import WebSocket from 'ws'
const NODE_ENV = process.env.NODE_ENV

import store from "./store"

import { saveOrUpdateChatSessionBatch4Init, saveOrUpdate4Message, selectUserSessionByContactId } from "./db/ChatSessionUserModel"
import { updateContactNoReadCount } from "./db/UserSettingModel"
import { saveMessage, saveMessageBatch, updateMessage } from "./db/ChatMessageModel"

const FILE_TYPE_MAP = {
    jpeg: 0, jpg: 0, png: 0, gif: 0, bmp: 0, webp: 0,
    mp4: 1, avi: 1, rmvb: 1, mkv: 1, mov: 1
}

const getFileTypeByName = (fileName = "") => {
    const suffixIndex = fileName.lastIndexOf(".");
    if (suffixIndex === -1) {
        return 2;
    }
    const suffix = fileName.substring(suffixIndex + 1).toLowerCase();
    const fileType = FILE_TYPE_MAP[suffix];
    return fileType == undefined ? 2 : fileType;
}

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
        let messageType = message.messageType;
        if (messageType !== undefined && messageType !== null && messageType !== "") {
            const normalizedMessageType = Number(messageType);
            if (!Number.isNaN(normalizedMessageType)) {
                messageType = normalizedMessageType;
                message.messageType = normalizedMessageType;
            }
        }
        if (message.contactType !== undefined && message.contactType !== null && message.contactType !== "") {
            const normalizedContactType = Number(message.contactType);
            if (!Number.isNaN(normalizedContactType)) {
                message.contactType = normalizedContactType;
            }
        }

        // 兼容服务端Bug：服务端对于普通文本消息可能漏传了 messageType 导致其默认为 0
        // 如果是 0，且没有 extendData 初始化数据包，却包含了实质的 messageId，说明这是一条真实的聊天消息，我们在前端强转为 2
        if (messageType === 0 && !message.extendData && message.messageId) {
            if (message.fileName) {
                messageType = 5;
                message.messageType = 5;
            } else {
                messageType = 2;
                message.messageType = 2;
            }
        }
        if ((messageType === 5 || message.messageType === 5) && message.fileType == null) {
            message.fileType = getFileTypeByName(message.fileName);
        }

        switch (messageType) {
            case 0://ws连接成功
                //保存会话消息
                await saveOrUpdateChatSessionBatch4Init(message.extendData.chatSessionList);
                //保存消息
                await saveMessageBatch(message.extendData.chatMessageList);
                //更新联系人申请数
                await updateContactNoReadCount({ userId: store.getUserId(), noReadCount: message.extendData.applyCount });
                //发送消息
                sender.send("reciveMessage", { messageType: message.messageType })
                break;
            case 6: //文件上传完成
                updateMessage({ status: message.status }, { messageId: message.messageId });
                sender.send("reciveMessage", message);
                break;
            case 2://聊天消息
            case 5://图片视频消息
                //如果是群聊消息，那么这个群里的所有人都会收到聊天消息，发送人和接收人是同一个人不做处理 
                if (message.sendUserId === store.getUserId() && message.contactType == 1) {
                    break;
                }
                //收到ws消息更新会话信息
                const sessionInfo = {};
                if (message.extendData && typeof message.extendData === "object") {
                    Object.assign(sessionInfo, message.extendData);
                } else {
                    Object.assign(sessionInfo, message);
                    //单聊更新联系人名称
                    if (message.contactType == 0 && messageType != 1) {
                        sessionInfo.contactName = message.sendUserNickName;
                    }
                    sessionInfo.lastReceiveTime = message.sendTime;
                }

                // 修复单聊时contactId为发送人的问题（兼容服务端没有回传contactType的情况）
                const isSingleChat = (
                    message.contactType === 0 ||
                    message.contactType === undefined ||
                    message.contactType === null ||
                    message.contactType === ""
                );
                if (isSingleChat && message.sendUserId !== store.getUserId()) {
                    message.contactId = message.sendUserId;
                    sessionInfo.contactId = message.sendUserId;
                    // 同步补齐空缺的 contactType，防止后续使用出错
                    message.contactType = 0;
                    sessionInfo.contactType = 0;
                }

                //11退出群聊 12移除群聊 减少成员数量
                if (messageType == 9 || messageType == 12 || messageType == 11) {
                    sessionInfo.memberCount = message.memberCount;
                }
                console.log("sessionInfo", sessionInfo);
                await saveOrUpdate4Message(store.getUserData("currentSessionId"), sessionInfo);
                //写入本地消息
                await saveMessage(message);
                //查询本地session 单聊联系人就是发送人，群聊联系人就是群号
                const dbSessionInfo = await selectUserSessionByContactId(message.contactId);
                message.extendData = dbSessionInfo;
                //退出群聊，当前用户不收到消息
                if (messageType == 11 && leaveGroupUserId == store.getUserId()) {
                    break;
                }
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
