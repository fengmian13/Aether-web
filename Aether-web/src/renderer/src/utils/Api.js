const api = {
    prodDomain:"http://127.0.0.1:6060",
    devDomain:"http://127.0.0.1:6060",
    prodwsDomain: "ws:/127.0.0.1:6061/ws",
    devWsDomain: "ws:/127.0.0.1:6061/ws",
    checkCode: "/account/checkCode",//验证码
    login:"/account/login",//登录
    register: "/account/register",//注册
    search: "/userContact/search",//搜索
    apply: "/userContact/contactApply",//申请
    contactNotice: "/userContact/loadContactApply",//申请列表
    dealWithApply: "/userContact/dealWithApply",//处理申请
    loadContact: "/userContact/loadContact",//加载联系人

}

export default api;