import {defineStore} from 'pinia'
export const useUserInfoStore = defineStore('userInfo',{ 

  state: () => {
    return {
      userInfo: JSON.parse(localStorage.getItem("userInfo")) || {},
    }},
    actions: { 
        setUserInfo(userInfo) {
          const safeUserInfo = userInfo && typeof userInfo === 'object' ? userInfo : {};
          this.userInfo = safeUserInfo;
          localStorage.setItem("userInfo", JSON.stringify(safeUserInfo));
        },
        getUserInfo() {
          return this.userInfo || {};
        },
    },
});
