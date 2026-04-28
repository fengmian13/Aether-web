import {
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
import { startLocalServer } from "../file";
const os = require("os");
const path = require("path");
const userDir = os.homedir();

const ensureTrailingSeparator = (folderPath) => {
    if (!folderPath) {
        return folderPath;
    }
    return folderPath.endsWith(path.sep) ? folderPath : folderPath + path.sep;
}

const updateContactNoReadCount = ({ userId, noReadCount }) => {
    return new Promise(async (resolve, reject) => {
        let sql = null;
        if (noReadCount === 0) {
            resolve();
            return;
        }
        if (noReadCount) {
            sql = "update user_setting set contact_no_read = contact_no_read+? where user_id = ?";
        } else {
            //清空未读数
            noReadCount = 0;
            sql = "update user_setting set contact_no_read = ? where user_id = ?";
        }
        await run(sql, [noReadCount, userId]);
        resolve();
    })
}

const addUserSetting = async (userId, email) => {
    let sql = "select max(server_port) server_port from user_setting"
    let { serverPort } = await queryOne(sql, []);
    if (serverPort == null) {
        serverPort = 10240;
    } else {
        serverPort++;
    }
    const sysSetting = {
        localFileFolder: ensureTrailingSeparator(path.join(userDir, ".Anther", "fileStorage"))
    }
    sql = "select * from user_setting where user_id = ?"
    const userInfo = await queryOne(sql, [userId]);

    let resultServerPort = null;
    let localFileFolder = path.join(sysSetting.localFileFolder, String(userId));
    if (userInfo) {
        await update("user_setting", { "email": email }, { "userId": userId })
        resultServerPort = userInfo.serverPort;
        const userSysSetting = JSON.parse(userInfo.sysSetting);
        localFileFolder = path.join(userSysSetting.localFileFolder, String(userId));
    } else {
        await insertOrIgnore("user_setting", {
            userId: userId,
            email: email,
            sysSetting: JSON.stringify(sysSetting),
            contactNoRead: 0,
            serverPort: serverPort
        })
        resultServerPort = serverPort;
    }
    // TODO: 启动本地服务
    startLocalServer(resultServerPort);
    store.setUserData("localServerPort", resultServerPort);
    store.setUserData("localFileFolder", localFileFolder);
}

const getCurrentUserSetting = async () => {
    const userId = store.getUserId();
    if (!userId) {
        return null;
    }
    const sql = "select * from user_setting where user_id = ?"
    const userInfo = await queryOne(sql, [userId]);
    if (!userInfo) {
        return null;
    }
    const sysSetting = userInfo.sysSetting ? JSON.parse(userInfo.sysSetting) : {};
    const currentFolder = path.join(sysSetting.localFileFolder || "", String(userId));
    return {
        ...userInfo,
        sysSetting,
        currentFolder
    }
}

const updateCurrentUserFileFolder = async (baseFolder) => {
    const userId = store.getUserId();
    if (!userId || !baseFolder) {
        return null;
    }
    const userInfo = await getCurrentUserSetting();
    const sysSetting = userInfo?.sysSetting || {};
    sysSetting.localFileFolder = ensureTrailingSeparator(baseFolder);
    await update("user_setting", { sysSetting: JSON.stringify(sysSetting) }, { userId });
    const currentFolder = path.join(sysSetting.localFileFolder, String(userId));
    store.setUserData("localFileFolder", currentFolder);
    return {
        sysSetting,
        currentFolder
    };
}

export {
    updateContactNoReadCount,
    addUserSetting,
    getCurrentUserSetting,
    updateCurrentUserFileFolder
}
