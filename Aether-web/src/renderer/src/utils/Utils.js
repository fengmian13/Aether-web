const isEmpty = (value) => {
    if(value === null || value === undefined || value === ''){
        return true;
    }
    return false;
};


const getAreaInfo = (data) => {
    if (isEmpty(data)) {
        return "-";
    }
    return data.replace(","," ");
}

export default {
    isEmpty
}