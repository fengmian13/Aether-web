import{
    run,
    queryOne,
    queryCount,
    queryAll,
    insertOrReplace,
    insertOrIgnore,
    insert,
    update
} from "./ADB"
import store from "../store"
import { updateNoReadCount } from "./ChatSessionUserModel"

const saveMessage= (data)=>{
    data.userId = store.getUserId();
    return insertOrIgnore("chat_message", data);
}

const saveMessageBatch = (chatMessageList)=>{
    return new Promise(async(resolve,reject)=>{
        const chatSessionCountMap= {};
        chatMessageList.forEach(item =>{
            let contactId = item.contactType==1?item.contactId:item.sendUserId;
            let noReadCount = chatSessionCountMap[contactId];
            if(!noReadCount){
                chatSessionCountMap[contactId] = 1;
            }else{
                chatSessionCountMap[contactId] = noReadCount+1;
            }
        });
        //更新未读数
        for(let item in chatSessionCountMap){
            await updateNoReadCount({contactId:item,noReadCount:chatSessionCountMap[item]});
        }
        // 批量插入数据
        chatMessageList.forEach(async item=>{
            await saveMessage(item);
        })
        resolve();
    })
}

export {
    saveMessageBatch
}
