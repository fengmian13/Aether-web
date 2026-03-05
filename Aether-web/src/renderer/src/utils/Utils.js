import moment from "moment";
const isEmpty = (value) => {
    if (value === null || value === undefined || value === '') {
        return true;
    }
    return false;
};


const getAreaInfo = (data) => {
    if (isEmpty(data)) {
        return "-";
    }
    return data.replace(",", " ");
}

// 格式化时间
const formatDate = (timestamp) => {
    const timestampTime = moment(timestamp);
    const days = Number.parseInt(moment().format("YYYYMMDD")) - Number.parseInt(timestampTime.format("YYYYMMDD"));

    if (days === 0) {
        return timestampTime.format("HH:mm");
    } else if (days === 1) {
        return "昨天";
    } else if (days >= 2 && days < 7) { // 大于1天小于7天显示星期几
        return timestampTime.format("dddd");
    } else if (days >= 7) { // 显示年月日
        return timestampTime.format("YY/MM/DD");
    }
};


/**
 * 将字节数转换为人类可读的文件大小字符串
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的字符串，如 "25.6 MB", "1.2 GB", "512 B"
 */
const size2Str = (bytes) => {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let size = bytes;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    // 保留两位小数，但去掉末尾不必要的 .00
    let formatted = size.toFixed(2);
    if (formatted.endsWith('.00')) {
        formatted = formatted.slice(0, -3); // 移除 ".00"
    } else if (formatted.endsWith('0')) {
        formatted = formatted.slice(0, -1); // 移除末尾单个 0，如 "25.60" → "25.6"
    }

    return `${formatted} ${units[unitIndex]}`;
};
export default {
    isEmpty,
    getAreaInfo,
    formatDate,
    size2Str
}