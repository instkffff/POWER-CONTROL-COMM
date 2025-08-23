import { openSerialPort, closeSerialPort, sendPacket, onPacketReceived } from '../Serial/SerialPort.js'
import { EVENT_TYPES, on } from '../Websocket/eventList.js';
import { getAllIds } from './IDlist.js';
import { update } from '../Database/main.js';
import { makePacket, parsePacket } from '../packetMaker/main.js';

const ReadKWHFunctionCode = 2
const ReadStatusFunctionCode = 7
const IDList = getAllIds();
const COM_PORT = 'COM5';

const serialConfig = {
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
};

let cronRunning = true;
let serialPortOpened = false;
let packetPromiseResolver = null;
let mainLoopInterval = null;
let portCheckInterval = null;
let listenerSetup = false;
let currentIDIndex = 0;
let taskCompleted = false; // 标记一轮任务是否已完成

// 监听停止定时任务事件：立即中断任务并关闭串口
on(EVENT_TYPES.CRON_STOP, () => {
    cronRunning = false;
    console.log('Cron任务已请求停止。');

    if (mainLoopInterval) {
        clearInterval(mainLoopInterval);
        mainLoopInterval = null;
    }
    
    // 如果有正在等待的Promise，立即拒绝它以中断await
    if (packetPromiseResolver) {
        packetPromiseResolver(new Error('任务已中断'));
        packetPromiseResolver = null;
    }

    if (serialPortOpened) {
        closeSerialPort();
        serialPortOpened = false;
        console.log('串口已关闭。');
    }
    
    // 重置监听器设置标志，确保重启时能重新设置监听器
    listenerSetup = false;
    currentIDIndex = 0; // 重置索引
    taskCompleted = false; // 重置完成标记
});

/**
 * 接收响应后更新数据库。
 * @param {number} deviceId - 设备 ID。
 * @param {object} parsedResponse - 解析后的响应数据。
 */
async function updateDatabaseAfterReceive(deviceId, parsedResponse) {
    const { functionCode, ...responseFields } = parsedResponse;

    switch (functionCode) {
        case '87': // status
            update.status({
                id: deviceId,
                statusCode: responseFields.statusCode,
                reasonCode: responseFields.reasonCode,
                voltage: responseFields.voltage,
                current: responseFields.current,
                power: responseFields.power
            });
            break;
        case '82': // readKWHR
            update.readKWHR({
                id: deviceId,
                rechargeKWH: responseFields.rechargeKWH,
                initialKWH: responseFields.initialKWH,
                usedKWH: responseFields.usedKWH,
                totalKWH: responseFields.totalKWH
            });
            break;
    }
}

/**
 * 发送数据包并等待响应。在发送前检查任务状态。
 * @param {Buffer} packet - 要发送的数据包
 * @returns {Promise<object>} 解析后的响应数据
 */
function sendPacketAndWaitForResponse(packet) {
    return new Promise((resolve, reject) => {
        if (!cronRunning) {
            return reject(new Error('任务已中断，无法发送数据。'));
        }
        
        const timeout = setTimeout(() => {
            packetPromiseResolver = null;
            reject(new Error('等待响应超时'));
        }, 1000); // 增加超时时间到1000ms

        packetPromiseResolver = (data) => {
            clearTimeout(timeout);
            packetPromiseResolver = null;
            resolve(data);
        };

        sendPacket(packet);
    });
}

/**
 * 执行定时任务，遍历IDList
 */
async function executeCronTask() {
    if (!cronRunning) return;
    
    // 如果一轮任务已完成，等待60分钟再重新开始
    if (taskCompleted) {
        console.log('一轮任务已完成，等待60分钟后重新开始...');
        return;
    }

    try {
        if (!serialPortOpened) {
            // 确保在重新打开串口前关闭可能存在的旧连接
            if (serialPortOpened) {
                try {
                    closeSerialPort();
                } catch (err) {
                    console.warn('关闭旧串口连接时出错:', err);
                }
            }
            
            await openSerialPort(COM_PORT, serialConfig);
            serialPortOpened = true;
            console.log('串口已打开，开始执行任务。');
            
            if (!listenerSetup) {
                setupPacketListener();
                listenerSetup = true;
                console.log('数据包监听器已设置。');
            }
        }
    } catch (error) {
        console.error('打开串口失败:', error.message);
        serialPortOpened = false;
        listenerSetup = false; // 串口打开失败时重置监听器标志
        return;
    }
    
    // 检查是否已完成所有ID
    if (currentIDIndex >= IDList.length) {
        currentIDIndex = 0; // 如果已完成，重置索引，下一次从头开始
    }

    // 从中断点继续执行
    for (let i = currentIDIndex; i < IDList.length; i++) {
        if (!cronRunning) {
            console.log('任务因中断请求而停止。');
            break;
        }

        const deviceId = IDList[i];
        try {

            const kwhPacket = makePacket(801310, ReadKWHFunctionCode, 'GP', {});
            const kwhResponse = await sendPacketAndWaitForResponse(kwhPacket);
            const parsedKwhData = parsePacket(kwhResponse, 'PRP');
            await updateDatabaseAfterReceive(deviceId, parsedKwhData);


            const statusPacket = makePacket(801310, ReadStatusFunctionCode, 'GP', {});
            const statusResponse = await sendPacketAndWaitForResponse(statusPacket);
            const parsedStatusData = parsePacket(statusResponse, 'PRP');
            await updateDatabaseAfterReceive(deviceId, parsedStatusData);

            // 成功处理后，更新索引
            currentIDIndex = i + 1;
        } catch (error) {
            console.error(`处理设备 ${deviceId} 时出错:`, error);
            // 失败时也更新索引，确保下一次从下一个ID开始
            currentIDIndex = i + 1; 
        }
    }
    
    // 如果循环完成，重置索引并标记任务完成
    if (currentIDIndex >= IDList.length) {
        currentIDIndex = 0;
        taskCompleted = true;
        console.log('所有设备处理完成，将在60分钟后重新开始');
    }
}

/**
 * 监听串口数据
 */
function setupPacketListener() {
    onPacketReceived((data) => {
        try {
            if (packetPromiseResolver) {
                packetPromiseResolver(data);
            }
        } catch (error) {
            console.error('处理接收到的数据时出错:', error);
        }
    });
}

/**
 * 启动主循环定时器
 */
async function startMainLoop() {
    if (mainLoopInterval) {
        clearInterval(mainLoopInterval);
    }
    
    // 设置定时器，每小时执行一次任务
    mainLoopInterval = setInterval(async () => {
        if (cronRunning) {
            // 每次定时器触发时重置taskCompleted标志，允许新循环开始
            taskCompleted = false;
            await executeCronTask();
        }
    }, 60 * 60 * 1000); // 每60分钟执行一次
    
    // 立即执行一次任务
    if (cronRunning) {
        taskCompleted = false;
        await executeCronTask();
    }
}

/**
 * 检查串口是否可用，并在可用时恢复任务
 */
async function checkAndResumeTask() {
    if (cronRunning) return;

    // 重置状态标志以确保正确恢复
    serialPortOpened = false;
    listenerSetup = false;
    // currentIDIndex 不重置，保持中断前的进度
    // taskCompleted 不重置，保持完成状态

    try {
        // 确保串口完全关闭后再打开
        try {
            closeSerialPort();
        } catch (err) {
            // 忽略关闭错误
        }
        
        await openSerialPort(COM_PORT, serialConfig);
        serialPortOpened = true;
        console.log('串口已重新打开，恢复任务。');
        
        if (!listenerSetup) {
            setupPacketListener();
            listenerSetup = true;
            console.log('数据包监听器已设置。');
        }
        
        cronRunning = true;
        await startMainLoop();
    } catch (error) {
        console.error('检查串口时失败:', error.message);
        serialPortOpened = false;
        listenerSetup = false;
    }
}

/**
 * 主函数
 */
async function Cron() {
    await startMainLoop();
    
    // 每分钟检查一次串口状态
    if (portCheckInterval) {
        clearInterval(portCheckInterval);
    }
    
    portCheckInterval = setInterval(async () => {
        await checkAndResumeTask();
    }, 60 * 1000);
}

export { Cron }

// 此处代码质量极差 全部由AI生成 多次AI修改 等以后再重写