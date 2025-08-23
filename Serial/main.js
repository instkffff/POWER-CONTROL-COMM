import { openSerialPort, closeSerialPort } from './SerialPort.js';
import { on, emit, EVENT_TYPES } from '../Websocket/eventList.js';
import { handleDeviceCommand } from './commandHandle.js';

// 全局状态管理
const state = {
    // 任务队列
    missionQueue: [],
    // 标记是否正在处理任务
    isProcessing: false,
    // 标记任务是否被强制停止
    isForceStopped: false,
    // 新增：用于存储当前正在处理的任务的ID
    currentMissionID: null, 
};

const serialConfig = {
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
};

// 添加事件监听器
function addEventListeners() {
    on(EVENT_TYPES.MISSION_SEND, queueMission);
    on(EVENT_TYPES.MISSION_STOP, cancelCurrentMission);
}

/**
 * 接收新任务，并加入队列。如果正在处理任务，则先取消当前任务。
 */
async function queueMission(newMission) {
    console.log('Received new mission');

    // 如果当前有任务正在执行，则先将其标记为取消
    if (state.isProcessing) {
        console.log('正在处理现有任务，将取消它并处理新任务...');
        state.isForceStopped = true;
        // 等待当前任务结束
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (!state.isProcessing) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);
        });
    }

    // 将新任务添加到队列
    state.missionQueue.push(newMission);

    // 如果队列没有在处理，就启动它
    if (!state.isProcessing) {
        processNextMission();
    }
}

/**
 * 强制取消当前正在处理的任务。
 */
function cancelCurrentMission() {
    console.log('Received mission stop command');
    // 设置取消标志，让正在执行的任务停止
    state.isForceStopped = true;
    
    // 使用全局变量来获取当前正在处理的任务ID
    const requestID = state.currentMissionID;

    // 发送任务失败通知
    emit(EVENT_TYPES.MISSION_FAILED, {
        type: 'command',
        RequestID: requestID,
        status: 'failed',
        message: '任务被用户取消',
        code: 2
    });
}

/**
 * 顺序处理任务队列中的下一个任务。
 */
async function processNextMission() {
    // 检查是否有任务需要处理
    if (state.missionQueue.length === 0) {
        return;
    }

    // 标记为正在处理
    state.isProcessing = true;
    state.isForceStopped = false;

    // 从队列中取出当前任务
    const currentMission = state.missionQueue.shift();
    const IDList = currentMission.data.IDList;
    const totalDevices = IDList.length;
    const requestID = currentMission.requestID;
    
    // 将当前任务的ID存入全局状态
    state.currentMissionID = requestID;

    let successCount = 0;
    let failCount = 0;
    let isCanceled = false;

    try {
        // 打开串口
        await openSerialPort('COM5', serialConfig);

        // 遍历并处理每个设备
        for (let i = 0; i < totalDevices; i++) {
            // 检查是否已取消
            if (state.isForceStopped) {
                isCanceled = true;
                throw new Error('任务被强制停止');
            }

            const deviceId = IDList[i];
            const progress = Math.round(((i + 1) / totalDevices) * 100);

            try {
                // 模拟处理设备命令
                await handleDeviceCommand(requestID, progress, deviceId, currentMission.data, true, 801310);
                console.log(`处理设备 ${deviceId} 成功, 进度: ${progress}%`);
                successCount++;
            } catch (error) {
                console.error(`处理设备 ${deviceId} 失败:`, error);
                failCount++;
            }
        }
        
        // 任务成功完成
        emit(EVENT_TYPES.MISSION_SUCCESS, {
            type: 'command',
            RequestID: requestID,
            status: 'finished',
            message: '任务完成',
            successCount,
            failCount,
            code: 3
        });

    } catch (error) {
        console.error('任务处理失败:', error.message);
        // 如果不是被主动取消，则发送失败通知
        if (!isCanceled) {
            emit(EVENT_TYPES.MISSION_FAILED, {
                type: 'command',
                RequestID: requestID,
                status: 'failed',
                message: error.message,
                code: 4
            });
        }
    } finally {
        // 无论成功或失败，都进行清理工作
        try {
            await closeSerialPort();
        } catch (closeError) {
            console.error('关闭串口失败:', closeError.message);
        }

        // 重置状态
        state.isProcessing = false;
        // 清除当前任务ID
        state.currentMissionID = null; 

        // 继续处理下一个任务（如果存在）
        if (state.missionQueue.length > 0) {
            processNextMission();
        }
    }
}

function startSerialService() {
    addEventListeners();
}

export { startSerialService };