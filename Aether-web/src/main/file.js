const fs = require('fs');
const fse = require('fs-extra');
const NODE_ENV = process.env.NODE_ENV;
const path = require('path');
const { app, ipcMain, shell } = require('electron');
const { exec } = require("child_process");
const FormData = require('form-data'); // 引入FormData模块（用于构建表单数据）
const axios = require('axios'); // 引入axios库
const { dialog } = require('electron')
import store from "./store";
const moment = require('moment');
moment.locale('zh-cn', {});
import { getWindow } from './windowProxy'

//express 服务器
const express = require('express')
const expressServer = express();

import { selectByMessageId } from "./db/ChatMessageModel";
const cover_image_suffix = "_cover.png";
const image_suffix = ".png";
const ffprobePath = "/assets/ffprobe.exe";
const ffmpegPath = "/assets/ffmpeg.exe"

const getDomain = () => {
    return NODE_ENV !== "development" ? store.getData("prodDomain") : store.getData("devDomain");
}

const parseBoolean = (value) => {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        return value.toLowerCase() === "true";
    }
    return false;
}

const mkdirs = (dir) => {
    if (!dir) return;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

const getResourcesPath = () => {
    let resPath = app.getAppPath();
    if (NODE_ENV !== 'development') {
        resPath = path.dirname(app.getPath("exe") + "/resources")
    }
    return resPath;
}

const getFFprobePath = () => {
    return path.join(getResourcesPath(), ffprobePath);
}
const getFFmegPath = () => {
    return path.join(getResourcesPath(), ffmpegPath)
}

const execCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            console.log("ffmpeg命令:", command);
            if (error) {
                console.error("执行命令失败", error);
                return reject(error);
            }
            resolve(stdout);
        });
    });
};

const saveFile2Local = (messageId, filePath, fileType) => {
    return new Promise(async (resolve, reject) => {
        try {
            let ffmpegPath = getFFmegPath()
            let savePath = await getLocalFilePath("chat", false, messageId);

            // 修复1：必须先确保目录存在，然后再执行复制操作
            const dir = path.dirname(savePath);
            if (!fs.existsSync(dir)) {
                mkdirs(dir);
            }

            fs.copyFileSync(filePath, savePath);
            let coverPath = null;

            if (fileType != 2) {
                let command = `${getFFprobePath()} -v error -select_streams v:0 -show_entries stream=codec_name "${filePath}"`;
                let result = await execCommand(command);
                result = result.replaceAll("\r\n", "");
                result = result.substring(result.indexOf("=") + 1);
                let codec = result.substring(0, result.indexOf("["));

                if ("hevc" === codec) {
                    const tempPath = savePath + ".tmp.mp4";

                    // 修复2：FFmpeg 应该输出到 tempPath，而不是 savePath
                    command = `${ffmpegPath} -y -i "${filePath}" -c:v libx264 -crf 20 "${tempPath}"`;
                    await execCommand(command);

                    // 替换原文件 (先删除旧的 savePath，再把临时文件重命名过来)
                    if (fs.existsSync(savePath)) {
                        fs.unlinkSync(savePath);
                    }
                    fs.renameSync(tempPath, savePath);
                }

                coverPath = savePath + cover_image_suffix;
                command = `${ffmpegPath} -i "${savePath}" -y -vframes 1 -vf "scale=min(170\\,iw*min(170/iw\\,170/ih)):min(170\\,ih*min(170/iw\\,170/ih))" "${coverPath}"`;
                await execCommand(command);
            }

            uploadFile(messageId, savePath, coverPath);
            resolve();
        } catch (error) {
            // 修复3：捕获异常并抛给外层的 Promise，避免 UnhandledPromiseRejectionWarning
            console.error("saveFile2Local 发生错误:", error);
            reject(error);
        }
    })
}

const uploadFile = (messageId, savePath, coverPath) => {
    const formData = new FormData();
    formData.append("messageId", messageId);
    formData.append("file", fs.createReadStream(savePath));

    if (coverPath) {
        formData.append("cover", fs.createReadStream(coverPath));
    }

    const url = `${getDomain()}/api/chat/uploadFile`;
    const token = store.getUserData("token");
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data',
            "token": token
        }
    };

    axios.post(url, formData, config)
        .then((response) => {
            // 可在此处理成功响应，例如：
            console.log("文件上传成功", response.data);
        })
        .catch((error) => {
            console.log("文件上传失败", error);
        });
};
const getLocalFilePath = (partType, showCover, fileId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let localFolder = store.getUserData("localFileFolder");
            let localPath = null;
            if (partType == "avatar") {
                // 修复：使用 path.join
                localFolder = path.join(localFolder, "avatar");
                if (!fs.existsSync(localFolder)) {
                    mkdirs(localFolder);
                }
                localPath = path.join(localFolder, fileId + image_suffix);
            } else if (partType == "chat") {
                let messageInfo = await selectByMessageId(fileId);
                const month = moment(Number.parseInt(messageInfo.sendTime)).format("YYYYMM");
                // 修复：使用 path.join
                localFolder = path.join(localFolder, month);
                if (!fs.existsSync(localFolder)) {
                    mkdirs(localFolder);
                }
                let fileSuffix = messageInfo.fileName;
                fileSuffix = fileSuffix.substring(fileSuffix.lastIndexOf("."));
                localPath = path.join(localFolder, fileId + fileSuffix);
            } else if (partType == "tmp") {
                localFolder = localFolder + "/tmp/"
                if (!fs.existsSync(localFolder)) {
                    mkdirs(localFolder);
                }
                localPath = localFolder + "/" + fileId
            } else {
                localPath = localFolder + "/" + fileId
            }
            if (showCover) {
                localPath = localPath + cover_image_suffix;
            }
            resolve(localPath);
        } catch (error) {
            reject(error); // 抛出内部异常
        }
    })
}

let server = null;

const startLocalServer = (serverPort) => {
    server = expressServer.listen(serverPort, () => {
        console.log("本地服务在http://127.0.0.1:" + serverPort + "开启");
    });
};

const closeLocalServer = () => {
    if (server) {
        server.close();
    }
};

//express 本地服务器
const FILE_TYPE_CONTENT_TYPE = {
    "0": "image/",
    "1": "video",
    "2": "application/octet-stream"
}

expressServer.get('/file', async (req, res) => {
    let { partType, fileType, fileId, showCover, forceGet } = req.query;
    //console.log("getFile", partType, fileType, fileId, showCover, forceGet);
    if (!partType || !fileId) {
        res.send("请求参数错误");
        return;
    }
    showCover = parseBoolean(showCover);
    const localPath = await getLocalFilePath(partType, showCover, fileId);
    if (!fs.existsSync(localPath) || forceGet == "true") {
        await downloadFile(fileId, showCover, localPath, partType);
    }

    //console.log("获取图片", new Date().getTime(), fileId, forceGet, partType);
    if (forceGet == "true" && partType == "avatar") {
        const mainWindow = getWindow("main");
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("reloadAvatar", fileId);
        }
    }

    const fileSuffix = localPath.substring(localPath.lastIndexOf(".") + 1);
    //图片直接返回
    let contentType = FILE_TYPE_CONTENT_TYPE[fileType] + fileSuffix;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Content-Type', contentType);
    //头像，缩略图，文件
    if (showCover || fileType != "1") {
        fs.createReadStream(localPath).pipe(res);
        return;
    }
    //视频文件 需要能够拖动需要通过range来获取文件流
    let stat = fs.statSync(localPath);
    let fileSize = stat.size;
    let range = req.headers.range;
    if (range) {
        //有range头才使用206状态码
        let parts = range.replace(/bytes=/, "").split("-");
        let start = parseInt(parts[0], 10);
        let end = parts[1] ? parseInt(parts[1], 10) : start + 999999;

        // end 在最后取值为 fileSize - 1 
        end = end > fileSize - 1 ? fileSize - 1 : end;

        let chunksize = (end - start) + 1;
        let stream = fs.createReadStream(localPath, {
            start,
            end
        });
        let head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        stream.pipe(res);
    } else {
        let head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(localPath).pipe(res);
    }
})

const downloadFile = (fileId, showCover, savePath, partType) => {
    showCover = showCover + "";
    let url = `${getDomain()}/api/chat/downloadFile`
    const token = store.getUserData('token');
    return new Promise(async (resolve, reject) => {
        try {
            const config = {
                responseType: "stream",
                headers: { 'Content-Type': 'multipart/form-data', 'token': token }
            };
            let response = await axios.post(url, {
                fileId,
                showCover,
                partType
            }, config);

            const folder = path.dirname(savePath);
            mkdirs(folder);
            const stream = fs.createWriteStream(savePath);

            if (response.headers['content-type'] == "application/json") {
                let resourcesPath = getResourcesPath();
                if (partType == "avatar") {
                    fs.createReadStream(resourcesPath + "/assets/user.png").pipe(stream);
                } else {
                    fs.createReadStream(resourcesPath + "/assets/404.png").pipe(stream);
                }
            } else {
                response.data.pipe(stream);
            }

            stream.on("finish", () => {
                stream.close();
                resolve();
            });

            stream.on("error", reject);
        } catch (err) {
            reject(err);
        }
    });
}


const saveAs = async ({ partType, fileId, fileType }) => {
    let fileName = "";
    if (partType == "avatar") {
        fileName = fileId + image_suffix;
    } else if (partType == "chat") {
        let messageInfo = await selectByMessageId(fileId);
        fileName = messageInfo.fileName;
    }
    const localPath = await getLocalFilePath(partType, false, fileId);
    //文件类型，没有预览，所以保存的时候判断本地是否有，没有就下载
    if (fileType == 2) {
        if (!fs.existsSync(localPath)) {
            await downloadFile(fileId, false, localPath, partType);
        }
    }
    const options = {
        title: '保存文件', // 对话框标题
        defaultPath: fileName
    }
    // 显示保存文件的对话框
    let result = await dialog.showSaveDialog(options);
    if (result.canceled || result.filePath == '') {
        return;
    }
    const filePath = result.filePath;
    fs.copyFileSync(localPath, filePath);
}


const createCover = (filePath) => {
    return new Promise(async (resolve, reject) => {
        try {
            let ffmpegPath = getFFmegPath();
            let avatarPath = await getLocalFilePath("avatar", false, store.getUserId() + "_temp");
            let command = `${ffmpegPath} -i "${filePath}" "${avatarPath}" -y`;
            await execCommand(command);

            let coverPath = await getLocalFilePath("avatar", false, store.getUserId() + "_temp_cover");
            command = `${ffmpegPath} -i "${filePath}" -y -vframes 1 -vf "scale=min(170\\,iw*min(170/iw\\,170/ih)):min(170\\,ih*min(170/iw\\,170/ih))" "${coverPath}"`;
            await execCommand(command);

            const avatarStream = fs.readFileSync(avatarPath);
            const coverStream = fs.readFileSync(coverPath);

            if (fs.existsSync(avatarPath)) {
                fs.unlinkSync(avatarPath);
            }
            if (fs.existsSync(coverPath)) {
                fs.unlinkSync(coverPath);
            }

            resolve({
                avatarStream,
                coverStream
            });
        } catch (error) {
            reject(error);
        }
    });
};

const saveAvatar2Local = async ({ userId, avatarByteArray, coverByteArray }) => {
    if (!userId) {
        return;
    }
    const avatarPath = await getLocalFilePath("avatar", false, userId);
    const coverPath = await getLocalFilePath("avatar", true, userId);
    const avatarBuffer = Buffer.from(avatarByteArray);
    const coverBuffer = Buffer.from(coverByteArray);
    fs.writeFileSync(avatarPath, avatarBuffer);
    fs.writeFileSync(coverPath, coverBuffer);
}

//保存剪切板内容
const saveClipBoardFile = async (file) => {
    const fileSuffix = file.name.substring(file.name.lastIndexOf("."));
    const filePath = await getLocalFilePath("tmp", false, "tmp" + fileSuffix);
    let byteArray = file.byteArray;
    const buffer = Buffer.from(byteArray);
    fs.writeFileSync(filePath, buffer);
    return {
        size: byteArray.length,
        name: file.name,
        path: filePath
    };
}

export {
    saveFile2Local,
    startLocalServer,
    closeLocalServer,
    createCover,
    saveAvatar2Local,
    saveAs,
    saveClipBoardFile
}
