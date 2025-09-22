// TimeSyncMission.js

import { openSerialPort, closeSerialPort, sendPacket, isSerialPortConnected } from '../Serial/SerialPort.js'
import { EVENT_TYPES, on } from '../Websocket/eventList.js';
import { getAllIds } from './IDlist.js';
import { makePacket } from '../packetMaker/main.js';
import { packet } from '../packet/main.js';
import { COM, TestMode, testDeviceId } from '../config.js';
import { COMMlog } from '../Log/main.js';

const TimeSyncFunctionCode = 15; // 时间同步功能码
const IDList = getAllIds();
const COM_PORT = COM;

const serialConfig = {
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
};

let timeSyncRunning = true;
let serialPortOpened = false;
let timeSyncInterval = null;
let portCheckInterval = null;
let currentIDIndex = 0;
let taskCompleted = false; // 标记一轮任务是否已完成

// 监听停止时间同步任务事件：立即中断任务并关闭串口
on(EVENT_TYPES.CRON_STOP, () => {
    timeSyncRunning = false;
    console.log('时间同步任务已请求停止。');

    if (timeSyncInterval) {
        clearInterval(timeSyncInterval);
        timeSyncInterval = null;
    }

    if (serialPortOpened) {
        closeSerialPort();
        serialPortOpened = false;
        console.log('串口已关闭。');
    }
});

/**
 * 发送时间同步数据包（无响应等待）
 * @param {Buffer} packet - 要发送的数据包
 * @returns {Promise<void>}
 */
function sendTimeSyncPacket(packet) {
    return new Promise((resolve, reject) => {
        if (!timeSyncRunning) {
            return reject(new Error('任务已中断，无法发送数据。'));
        }

        if (!serialPortOpened) {
            return reject(new Error('串口未打开，无法发送数据。'));
        }
        
        // 发送时间同步数据包
        sendPacket(packet)
            .then(() => {
                // 时间同步命令无响应，直接resolve
                resolve();
            })
            .catch((error) => {
                // 更新串口状态标志
                serialPortOpened = false;
                console.error('发送时间同步数据包失败:', error);
                reject(new Error(`发送时间同步数据包失败: ${error.message}`));
            });
    });
};

/**
 * 执行时间同步任务，遍历IDList
 */
async function executeTimeSyncTask() {
    if (!timeSyncRunning) return;
    
    if (taskCompleted) {
        console.log('一轮时间同步任务已完成');
        return;
    }

    // 只有在串口未打开时才尝试打开
    if (!serialPortOpened) {
        try {
            await openSerialPort(COM_PORT, serialConfig);
            serialPortOpened = true;
            console.log('串口已打开，开始执行时间同步任务。');
        } catch (error) {
            console.error('打开串口失败，串口可能被其他程序占用:', error.message);
            serialPortOpened = false;
            return;
        }
    }
    
    // 检查是否已完成所有ID
    if (currentIDIndex >= IDList.length) {
        currentIDIndex = 0; // 如果已完成，重置索引，下一次从头开始
    }

    // 从中断点继续执行
    for (let i = currentIDIndex; i < IDList.length; i++) {
        if (!timeSyncRunning) {
            console.log('时间同步任务因中断请求而停止。');
            break;
        }

        const deviceId = IDList[i];
        try {
            let _deviceId = deviceId;

            if (TestMode) {
                _deviceId = testDeviceId;
            }

            // 获取时间同步数据
            const timeData = packet.timeSync.GTD(); 
            
            // 构造时间同步数据包
            const timeSyncPacket = makePacket(_deviceId, TimeSyncFunctionCode, 'GP', timeData);
            await COMMlog(timeSyncPacket);
            
            // 发送时间同步命令（无响应等待）
            await sendTimeSyncPacket(timeSyncPacket);

            console.log(`设备 ${deviceId} 时间同步完成`);

            // 成功处理后，更新索引
            currentIDIndex = i + 1;
        } catch (error) {
            console.error(`处理设备 ${deviceId} 时间同步时出错:`, error);
            // 失败时也更新索引，确保下一次从下一个ID开始
            currentIDIndex = i + 1; 
            
            // 如果是串口断开错误，中断整个任务循环
            if (error.message.includes('串口未打开')) {
                console.log('由于串口断开，中断时间同步任务循环');
                // 重置状态以便在下次检查时重新开始
                serialPortOpened = false;
                timeSyncRunning = false;
                break;
            }
        }
    }
    
    // 如果循环完成，重置索引并标记任务完成
    if (currentIDIndex >= IDList.length) {
        currentIDIndex = 0;
        taskCompleted = true;
        console.log('时间同步任务完成');
        closeSerialPort();
        serialPortOpened = false; // 关闭串口后重置标志
    }
}

/**
 * 启动时间同步主循环定时器
 */
async function startTimeSyncLoop() {
    if (timeSyncInterval) {
        clearInterval(timeSyncInterval);
    }
    
    // 设置定时器，每12小时执行一次时间同步任务
    timeSyncInterval = setInterval(async () => {
        if (timeSyncRunning) {
            // 每次定时器触发时重置taskCompleted标志，允许新循环开始
            taskCompleted = false;
            await executeTimeSyncTask();
        }
    }, 2 * 60 * 60 * 1000); // 每2小时执行一次
    
    // 立即执行一次任务
    if (timeSyncRunning) {
        taskCompleted = false;
        await executeTimeSyncTask();
    }
}

/**
 * 检查串口是否可用，并在可用时恢复任务
 */
async function checkAndResumeTimeSyncTask() {
    if (timeSyncRunning) return;

    // 重置状态标志以确保正确恢复
    serialPortOpened = false;
    currentIDIndex = 0; // 时间同步任务可以重新从头开始
    taskCompleted = false;

    try {
        await openSerialPort(COM_PORT, serialConfig);
        serialPortOpened = true;
        console.log('串口已重新打开，恢复时间同步任务。');
        
        timeSyncRunning = true;
        await startTimeSyncLoop();
    } catch (error) {
        console.error('检查串口时失败:', error.message);
        serialPortOpened = false;
    }
}

/**
 * 时间同步主函数
 */
async function TimeSync() {
    await startTimeSyncLoop();
    
    // 每分钟检查一次串口状态
    if (portCheckInterval) {
        clearInterval(portCheckInterval);
    }
    
    portCheckInterval = setInterval(async () => {
        let status = isSerialPortConnected();

        if (!status) {
            await checkAndResumeTimeSyncTask();
        }
    }, 60 * 1000);
}

export { TimeSync }