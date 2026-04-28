import WebSocket from 'ws'
const NODE_ENV = process.env.NODE_ENV

import store from './store'

import { saveOrUpdateChatSessionBatch4Init, saveOrUpdate4Message, selectUserSessionByContactId } from './db/ChatSessionUserModel'
import { updateContactNoReadCount } from './db/UserSettingModel'
import { saveMessage, saveMessageBatch, updateMessage } from './db/ChatMessageModel'

const FILE_TYPE_MAP = {
  jpeg: 0, jpg: 0, png: 0, gif: 0, bmp: 0, webp: 0,
  mp4: 1, avi: 1, rmvb: 1, mkv: 1, mov: 1
}

const getFileTypeByName = (fileName = '') => {
  const suffixIndex = fileName.lastIndexOf('.')
  if (suffixIndex === -1) {
    return 2
  }
  const suffix = fileName.substring(suffixIndex + 1).toLowerCase()
  const fileType = FILE_TYPE_MAP[suffix]
  return fileType == undefined ? 2 : fileType
}

let ws = null
let maxReConnectTimes = null
let lockReconnect = false
let wsUrl = null
let sender = null
let needReconnect = null
let heartBeatTimer = null

const initWs = (config, currentSender) => {
  wsUrl = `${NODE_ENV !== 'development' ? store.getData('prodWsDomain') : store.getData('devWsDomain')}?token=${config.token}`
  sender = currentSender
  needReconnect = true
  maxReConnectTimes = 5
  createWs()
}

const handleChatMessage = async (message) => {
  let messageType = message.messageType
  if (messageType !== undefined && messageType !== null && messageType !== '') {
    const normalizedMessageType = Number(messageType)
    if (!Number.isNaN(normalizedMessageType)) {
      messageType = normalizedMessageType
      message.messageType = normalizedMessageType
    }
  }

  if (message.contactType !== undefined && message.contactType !== null && message.contactType !== '') {
    const normalizedContactType = Number(message.contactType)
    if (!Number.isNaN(normalizedContactType)) {
      message.contactType = normalizedContactType
    }
  }

  if (messageType === 0 && !message.extendData && message.messageId) {
    if (message.fileName) {
      messageType = 5
      message.messageType = 5
    } else {
      messageType = 2
      message.messageType = 2
    }
  }

  if ((messageType === 5 || message.messageType === 5) && message.fileType == null) {
    message.fileType = getFileTypeByName(message.fileName)
  }

  switch (messageType) {
    case 0:
      await saveOrUpdateChatSessionBatch4Init(message.extendData.chatSessionList)
      await saveMessageBatch(message.extendData.chatMessageList)
      await updateContactNoReadCount({
        userId: store.getUserId(),
        noReadCount: message.extendData.applyCount
      })
      sender?.send('reciveMessage', { messageType: message.messageType })
      break
    case 6:
      updateMessage({ status: message.status }, { messageId: message.messageId })
      sender?.send('reciveMessage', message)
      break
    case 1:
    case 2:
    case 5: {
      if (message.sendUserId === store.getUserId() && message.contactType == 1) {
        break
      }

      const sessionInfo = {}
      if (message.extendData && typeof message.extendData === 'object') {
        Object.assign(sessionInfo, message.extendData)
      } else {
        Object.assign(sessionInfo, message)
        if (message.contactType == 0 && messageType != 1) {
          sessionInfo.contactName = message.sendUserNickName
        }
        sessionInfo.lastReceiveTime = message.sendTime
      }

      const isSingleChat =
        message.contactType === 0 ||
        message.contactType === undefined ||
        message.contactType === null ||
        message.contactType === ''

      if (isSingleChat && message.sendUserId !== store.getUserId()) {
        message.contactId = message.sendUserId
        sessionInfo.contactId = message.sendUserId
        message.contactType = 0
        sessionInfo.contactType = 0
      }

      if (messageType == 9 || messageType == 12 || messageType == 11) {
        sessionInfo.memberCount = message.memberCount
      }

      await saveOrUpdate4Message(store.getUserData('currentSessionId'), sessionInfo)
      await saveMessage(message)
      const dbSessionInfo = await selectUserSessionByContactId(message.contactId)
      message.extendData = dbSessionInfo
      sender?.send('reciveMessage', message)
      break
    }
  }
}

const createWs = () => {
  if (wsUrl == null) {
    return
  }

  ws = new WebSocket(wsUrl)

  ws.onopen = function () {
    console.log('ws connected')
    ws.send('heart beat')
    maxReConnectTimes = 5
  }

  ws.onmessage = async function (e) {
    const message = JSON.parse(e.data)
    const isCallMessage =
      message?.bizType === 'call' ||
      Number(message?.messageType) === 23 ||
      (message?.extendData && typeof message.extendData === 'object' && !!message.extendData.event)

    if (isCallMessage) {
      sender?.send('call:signal', message)
      return
    }
    await handleChatMessage(message)
  }

  ws.onclose = function () {
    console.log('ws closed')
    reconnect()
  }

  ws.onerror = function () {
    console.log('ws error')
    reconnect()
  }

  const reconnect = () => {
    if (!needReconnect) {
      console.log('ws reconnect disabled')
      return
    }
    if (ws != null) {
      ws.close()
    }
    if (lockReconnect) {
      return
    }
    lockReconnect = true
    if (maxReConnectTimes > 0) {
      console.log('reconnecting ws', maxReConnectTimes)
      maxReConnectTimes--
      setTimeout(() => {
        createWs()
        lockReconnect = false
      }, 5000)
    } else {
      console.log('ws reconnect timeout')
    }
  }

  if (heartBeatTimer) {
    clearInterval(heartBeatTimer)
  }
  heartBeatTimer = setInterval(() => {
    if (ws != null && ws.readyState == 1) {
      ws.send('heart beat')
    }
  }, 5000)
}

const closeWs = () => {
  needReconnect = false
  if (heartBeatTimer) {
    clearInterval(heartBeatTimer)
    heartBeatTimer = null
  }
  ws?.close()
}

const sendWsMessage = (message) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error('WebSocket not connected')
  }
  ws.send(typeof message === 'string' ? message : JSON.stringify(message))
}

const isWsConnected = () => {
  return !!ws && ws.readyState === WebSocket.OPEN
}

export {
  initWs,
  closeWs,
  sendWsMessage,
  isWsConnected
}
