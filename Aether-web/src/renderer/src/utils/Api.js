const api = {
    prodDomain: "http://127.0.0.1:6060",
    devDomain: "http://127.0.0.1:6060",
    prodwsDomain: "ws://127.0.0.1:6061/ws",
    devWsDomain: "ws://127.0.0.1:6061/ws",
    checkCode: "/account/checkCode",//验证码
    login: "/account/login",//登录
    register: "/account/register",//注册
    search: "/userContact/search",//搜索
    apply: "/userContact/contactApply",//申请
    contactNotice: "/userContact/loadContactApply",//申请列表
    dealWithApply: "/userContact/dealWithApply",//处理申请
    loadContact: "/userContact/loadContact",//加载联系人
    loadMyGroup: "/group/loadMyGroup",//我创建的群组
    saveGroup: "/group/saveGroup",//保存群组TODO
    getGroupInfo: "/group/getGroupInfo",
    uploadImage: "/file/uploadImage",//上传图片
    addContact2BlackList: "/userContact/addContact2BlackList",//加入黑名单
    delContact: "/userContact/delContact",//删除联系人
    getUserInfoByUserId: "/userInfo/getUserInfoByUserId",//获取用户信息
    getUserInfo: "/userInfo/getUserInfo",//获取用户信息
    dissolutionGroup: "/group/dissolutionGroup",//解散群组
    leaveGroup: "/group/leaveGroup",//退出群组
    getContactInfo: "/userContact/getContactInfo",//获取联系人信息
    sendMessage: "/chat/sendMessage",//发送消息
    sendMessageFile: "/chat/sendMessageFile",//上传文件
    saveUserInfo: "/userInfo/saveUserInfo",
    saveSysSetting: "/admin/saveSysSetting",//保存系统设置
}

export default api;
