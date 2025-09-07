import { openSerialPort, closeSerialPort, sendPacket, onPacketReceived, isSerialPortConnected } from '../Serial/SerialPort.js'
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

    if (serialPortOpened) {
        closeSerialPort();
        serialPortOpened = false;
        console.log('串口已关闭。');
    }
    
    // 重置监听器设置标志，确保重启时能重新设置监听器
    listenerSetup = false;
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

        if (!serialPortOpened) {
            return reject(new Error('串口未打开，无法发送数据。'));
        }
        
        // 添加额外的串口状态检查
        sendPacket(packet)
            .then(() => {
                // 监听响应数据
                const unsubscribe = onPacketReceived((data) => {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve(data);
                });

                // 设置超时计时器
                const timeout = setTimeout(() => {
                    try {
                        unsubscribe();
                    } catch (error) {
                        console.error('关闭串口失败:', error.message);
                    }
                    reject(new Error('等待响应超时'));
                }, 500);
            })
            .catch((error) => {
                // 更新串口状态标志
                serialPortOpened = false;
                console.error('发送数据包失败:', error);
                reject(new Error(`发送数据包失败: ${error.message}`));
            });
    });
};

/**
 * 执行定时任务，遍历IDList
 */
async function executeCronTask() {
    if (!cronRunning) return;
    
    if (taskCompleted) {
        console.log('周期一轮任务已完成');
        return;
    }

    // 只有在串口未打开时才尝试打开
    if (!serialPortOpened) {
        try {
            await openSerialPort(COM_PORT, serialConfig);
            serialPortOpened = true;
            console.log('串口已打开，开始执行任务。');
            
            if (!listenerSetup) {
                listenerSetup = true;
                console.log('数据包监听器已设置。');
            }
        } catch (error) {
            console.error('打开串口失败，串口可能被其他程序占用:', error.message);
            serialPortOpened = false;
            listenerSetup = false;
            return;
        }
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
            const kwhPacket = makePacket(deviceId, ReadKWHFunctionCode, 'GP', {});
            const kwhResponse = await sendPacketAndWaitForResponse(kwhPacket);
            const parsedKwhData = parsePacket(kwhResponse, 'PRP');
            await updateDatabaseAfterReceive(deviceId, parsedKwhData);

            const statusPacket = makePacket(deviceId, ReadStatusFunctionCode, 'GP', {});
            const statusResponse = await sendPacketAndWaitForResponse(statusPacket);
            const parsedStatusData = parsePacket(statusResponse, 'PRP');
            await updateDatabaseAfterReceive(deviceId, parsedStatusData);

            // 成功处理后，更新索引
            currentIDIndex = i + 1;
        } catch (error) {
            console.error(`处理设备 ${deviceId} 时出错:`, error);
            // 失败时也更新索引，确保下一次从下一个ID开始
            currentIDIndex = i + 1; 
            
            // 如果是串口断开错误，中断整个任务循环
            if (error.message.includes('串口未打开')) {
                console.log('由于串口断开，中断任务循环');
                // 重置状态以便在下次检查时重新开始
                serialPortOpened = false;
                listenerSetup = false;
                cronRunning = false;
                break;
            }
        }
    }
    
    // 如果循环完成，重置索引并标记任务完成
    if (currentIDIndex >= IDList.length) {
        currentIDIndex = 0;
        taskCompleted = true;
        console.log('周期任务完成');
        closeSerialPort();
        serialPortOpened = false; // 关闭串口后重置标志
    }
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
        await openSerialPort(COM_PORT, serialConfig);
        serialPortOpened = true;
        console.log('串口已重新打开，恢复任务。');
        
        if (!listenerSetup) {
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
        let status = isSerialPortConnected();

        if (!status) {
            await checkAndResumeTask();
        }
    }, 60 * 1000);
}

export { Cron }
