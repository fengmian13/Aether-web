import {defineStore} from 'pinia'
export const userContactStateStore = defineStore('contactStateInfo',{ 

  state: () => {
    return {
      contactRelaod: null,
      delContactId: null,
    }},
    actions: { 
        setContactRelaod(state) {
          this.contactRelaod = state;
        },
        delContactId(delContactId) {
          this.delContactId = delContactId;
        }
    }
});