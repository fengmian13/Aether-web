import {defineStore} from 'pinia'
export const userContactStateStore = defineStore('contactStateInfo',{ 

  state: () => {
    return {
      contactReload: null
    }},
    actions: { 
        setContactReload(state) {
          this.contactReload = null;
          this.contactReload = state;
        }
    }
});