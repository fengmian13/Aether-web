import axios from 'axios'
import { ElLoading } from 'element-plus'
import Message from '../utils/Message'
import Api from '../utils/Api'
const contentTypeForm = 'application/x-www-form-urlencoded;charset=UTF-8'
const contentTypeJson = 'application/json'
const responseTypeJson = 'json';
let loading = null;
const instance = axios.create({
    withcredentials: true,
    baseURL: (import.meta.env.PRoD ? Api.prodDomain :"") + "/api",
    timeout: 10 * 1000,
});
//请求前拦截器
instance.interceptors.request.use(
    (config) => {
        if (config.showLoading) {
            loading = ElLoading.service({
                lock: true,
                text: '加载中......',
                background: 'rgba(0, 0, 0, 0.7)',
            });
        }
        return config;
    },
    (error) => {
        if (config.showLoading && loading) {
            loading.close();
        }
        Message.error("请求发送失败");
        return Promise.reject("请求发送失败");
    }
);
//请求后拦截器
instance.interceptors.response.use(
    (response) => {
        const { showLoading, errorCallback, showError = true } = response.config;
        if (showLoading && loading) {
            loading.close()
        }
        const responseData = response.data;

        // 🟢 修改点：将 config 改为 response.config
        if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
            return responseData;
        }
        
        //正常请求
        if (responseData.code == 200) {
            return responseData;
        } else if (responseData.code == 901) {
            //登录超时
            setTimeout(() => {
                window.ipcRenderer.send("/reLogin")
            }, 2000);
            return Promise.reject({ showError: true, msg: "登录超时" });
        } else {
            //其他错误
            if (errorCallback) {
                errorCallback(responseData);
            }
            return Promise.reject({ showError: showError, msg: responseData.info });
        }
    },
    (error) => {
        // 注意：这里 error.config 可能为空，最好加个问号防止报错
        if (error.config?.showLoading && loading) {
            loading.close();
        }
        return Promise.reject({ showError: true, msg: "网络异常" })
    }
);

const request = (config) => {
    const { url, params, dataType, showLoading = true, responseType = responseTypeJson, showError = true } = config;
    let contentType = contentTypeForm;
    let formData = new FormData();// 创建form对象
    for (let key in params) {
        formData.append(key, params[key] == undefined ? "" : params[key]);
    }
    if (dataType != null && dataType == 'json') {
        contentType = contentTypeJson;
    }
    const token = localStorage.getItem("token");
    let headers = {
        'Content-Type': contentType,
        'X-Requested-With': 'XMLHttpRequest',
        token: token
    }
    return instance.post(url, formData, {
        headers: headers,
        showLoading: showLoading,
        errorCallback: config.errorCallback,
        showError: config.showError,
        responseType: responseTypeJson
    }).catch(error => {
        console.log(error);
        if (error.showError) {
            Message.error(error.msg);
        }
        return null;
    });
};

export default request;
