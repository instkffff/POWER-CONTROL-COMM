import { openSerialPort, closeSerialPort } from './SerialPort.js';
import { on, emit, EVENT_TYPES } from '../Websocket/eventList.js';
import { handleDeviceCommand } from './commandHandle.js';

const flag = {
    // 强制停止标志
    forceStop: false,
    // 当前正在执行的任务
    currentMission: null,
};

const serialConfig = {
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
};

// 任务队列
let missionQueue = [];
let isProcessing = false;

function addEventListeners() {
    on(EVENT_TYPES.MISSION_SEND, mission);
    on(EVENT_TYPES.MISSION_STOP, missionStop);
}

async function mission(missionList) {
    console.log('mission receive');

    // 如果正在处理任务，则先设置强制停止标志
    if (isProcessing) {
        console.log('收到新任务，取消当前任务...');
        flag.forceStop = true;
        // 等待当前任务处理完成
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (!isProcessing) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);
        });
    }

    // 将新任务加入队列
    missionQueue.push(missionList);

    // 如果没有在处理任务，则开始处理队列
    if (!isProcessing) {
        processMissionQueue();
    }
}

function missionStop() {
    console.log('missionStop');
    // 设置强制停止标志
    flag.forceStop = true;
    
    const RequestID = flag.currentMission.requestID;
    emit(EVENT_TYPES.MISSION_FAILED, {
        type: 'command',
        RequestID: RequestID,
        status: 'failed',
        message: '任务被取消',
    });
}

/**
 * 顺序处理任务队列
 */
async function processMissionQueue() {
    if (isProcessing || missionQueue.length === 0) {
        return;
    }

    isProcessing = true;
    const currentMission = missionQueue.shift();

    // 重置停止标志
    flag.forceStop = false;
    flag.currentMission = currentMission;

    let isCanceled = false;

    try {
        // 打开串口
        await openSerialPort('COM5', serialConfig);

        const IDList = currentMission.data.IDList;
        const IDListLength = IDList.length;
        let requestID = currentMission.requestID;

        // 任务计数器
        let successCount = 0;
        let failCount = 0;

        // 处理每个设备
        for (let i = 0; i < IDListLength; i++) {
            // 检查是否需要强制停止
            if (flag.forceStop) {
                isCanceled = true;
                throw new Error('任务被强制停止');
            }

            const deviceId = IDList[i];
            const progress = Math.round(((i + 1) / IDListLength) * 100);

            try {
                // handleDeviceCommand 函数应在此处被调用
                await handleDeviceCommand(requestID, progress, deviceId, currentMission.data, false, 801310);
                console.log(`正在处理设备 ${deviceId}, 进度: ${progress}%`);
                await new Promise(resolve => setTimeout(resolve, 500)); // 模拟异步操作
                successCount++;
            } catch (error) {
                console.error(`处理设备 ${deviceId} 失败:`, error);
                failCount++;
            }
        }

        // 任务完成，发送成功事件
        emit(EVENT_TYPES.MISSION_SUCCESS, {
            type: 'command',
            RequestID: requestID,
            status: 'success',
            message: '任务完成',
            successCount: successCount,
            failCount: failCount,
        });

    } catch (error) {
        console.error('处理任务时出错:', error);
        if (!isCanceled) {
            const RequestID = flag.currentMission ? flag.currentMission.requestID : null;
            emit(EVENT_TYPES.MISSION_FAILED, {
                type: 'command',
                RequestID: RequestID,
                status: 'failed',
                message: error.message,
            });
        }
    } finally {
        try {
            await closeSerialPort();
        } catch (closeError) {
            console.error('关闭串口时出错:', closeError);
        }

        isProcessing = false;
        flag.currentMission = null;

        // 如果队列中还有任务，则继续处理下一个
        if (missionQueue.length > 0) {
            processMissionQueue();
        }
    }
}

function startSerialService() {
    addEventListeners();
}

// 导出启动函数
export { startSerialService };