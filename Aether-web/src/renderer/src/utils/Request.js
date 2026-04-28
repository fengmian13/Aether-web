import axios from 'axios'
import { ElLoading } from 'element-plus'
import Message from '../utils/Message'
import Api from '../utils/Api'

const contentTypeForm = 'application/x-www-form-urlencoded;charset=UTF-8'
const contentTypeJson = 'application/json'
const responseTypeJson = 'json'

let loading = null

const instance = axios.create({
  withcredentials: true,
  baseURL: `${import.meta.env.PROD ? Api.prodDomain : Api.devDomain}/api`,
  timeout: 10 * 1000
})

const closeLoading = () => {
  if (loading) {
    loading.close()
    loading = null
  }
}

instance.interceptors.request.use(
  (config) => {
    if (config.showLoading) {
      loading = ElLoading.service({
        lock: true,
        text: '加载中...',
        background: 'rgba(0, 0, 0, 0.7)'
      })
    }
    return config
  },
  (error) => {
    closeLoading()
    Message.error('请求发送失败')
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (response) => {
    const { showLoading, errorCallback, showError = true } = response.config
    if (showLoading) {
      closeLoading()
    }
    const responseData = response.data

    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return responseData
    }

    if (responseData.code == 200) {
      return responseData
    }
    if (responseData.code == 901) {
      setTimeout(() => {
        window.ipcRenderer.send('reLogin')
      }, 2000)
      return Promise.reject({ showError: true, msg: '登录超时' })
    }
    if (errorCallback) {
      errorCallback(responseData)
    }
    return Promise.reject({ showError, msg: responseData.info })
  },
  (error) => {
    if (error.config?.showLoading) {
      closeLoading()
    }
    return Promise.reject({ showError: true, msg: '网络异常' })
  }
)

const buildHeaders = (contentType, hasBinary) => {
  const token = localStorage.getItem('token')
  const headers = {
    'X-Requested-With': 'XMLHttpRequest',
    token
  }

  if (!hasBinary && contentType) {
    headers['Content-Type'] = contentType
  }

  return headers
}

const handleRequestError = (error) => {
  console.log(error)
  if (error.showError) {
    Message.error(error.msg)
  }
  return null
}

const post = (config) => {
  const { url, params = {}, dataType, showLoading = true } = config
  let contentType = contentTypeForm
  const formData = new FormData()
  let hasBinary = false

  Object.keys(params).forEach((key) => {
    const value = params[key] == undefined ? '' : params[key]
    if (value instanceof File || value instanceof Blob) {
      hasBinary = true
    }
    formData.append(key, value)
  })

  if (dataType === 'json') {
    contentType = contentTypeJson
  }

  return instance
    .post(url, formData, {
      headers: buildHeaders(contentType, hasBinary),
      showLoading,
      errorCallback: config.errorCallback,
      showError: config.showError,
      responseType: responseTypeJson
    })
    .catch(handleRequestError)
}

const get = (config) => {
  const { url, params = {}, showLoading = true } = config
  return instance
    .get(url, {
      params,
      headers: buildHeaders(null, false),
      showLoading,
      errorCallback: config.errorCallback,
      showError: config.showError,
      responseType: responseTypeJson
    })
    .catch(handleRequestError)
}

const request = (config) => post(config)

request.get = get

export default request
