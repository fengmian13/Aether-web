import { ElMessageBox } from "element-plus";

const confirm = ({ message, okfun, showCancelBtn = true, okText = '确认'}) =>{
    ElMessageBox.confirm(message, '提示', {
        "close-on-click-modal": false,
        confirmButtonText: okText,
        cancelButtonText: '取消',
        type: 'info',
        showCancelButton: showCancelBtn
    }).then(async () => {
        if (okfun){
            await okfun();
        }
    }).catch(() => {
        //取消
    });
};

export default confirm;