import { bcdBufferToHexString, hexStringToBcdBuffer, bufferToInt1, intToBuffer1 } from './HEX.js';

/* 
send data

function code 15
length 0E
second 30 30 // 00s ASCII码
minute 30 37 // 07m ASCII码
hour 31 37 // 17h ASCII码
day 30 31 // 01d ASCII码
mouth 30 38 // 08w ASCII码
week 30 31 // 01m ASCII码
year 32 35 // 05y ASCII码

*/

/**
 * 生成时间同步命令数据包
 * @param {number} functionCode - 功能码 (默认15)
 * @param {Object} timeData - 时间数据
 * @param {number} timeData.second - 秒 (0-59)
 * @param {number} timeData.minute - 分 (0-59)
 * @param {number} timeData.hour - 时 (0-23)
 * @param {number} timeData.day - 日 (1-31)
 * @param {number} timeData.month - 月 (1-12)
 * @param {number} timeData.week - 周 (1-7)
 * @param {number} timeData.year - 年 (0-99)
 * @returns {Buffer} - 完整的命令数据Buffer
 */
function generateTimeSyncPacket(functionCode = 15, timeData = {
    second: 0,
    minute: 7,
    hour: 17,
    day: 1,
    month: 8,
    week: 1,
    year: 5
}) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString().padStart(2, '0');
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 将时间数据转换为ASCII码格式的Buffer
    const timeBuffers = [];
    const timeFields = ['second', 'minute', 'hour', 'day', 'month', 'week', 'year'];
    
    for (const field of timeFields) {
        const value = timeData[field];
        // 将数字转换为ASCII码格式Buffer
        // 十位数在前，个位数在后
        const tens = Math.floor(value / 10) + 0x30; // 转换为ASCII码
        const units = value % 10 + 0x30; // 转换为ASCII码
        const asciiBuffer = Buffer.from([tens, units]);
        timeBuffers.push(asciiBuffer);
    }
    
    // 数据部分
    const dataBuffer = Buffer.concat(timeBuffers);
    
    // 计算长度（字节数）
    const length = dataBuffer.length;
    const lengthBuffer = intToBuffer1(length);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer, dataBuffer]);
    
    return packet;
}

/**
 * 解析时间同步命令数据包
 * @param {Buffer} packet - 命令数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseTimeSyncPacket(packet) {
    if (packet.length < 2) {
        throw new Error('命令数据包长度不足');
    }
    
    // 解析功能码（BCD格式）
    const functionCodeBuffer = packet.slice(0, 1);
    const functionCode = bcdBufferToHexString(functionCodeBuffer);
    
    // 解析长度
    const lengthBuffer = packet.slice(1, 2);
    const length = bufferToInt1(lengthBuffer);
    
    // 验证长度是否匹配
    if (packet.length !== (2 + length)) {
        throw new Error('数据包长度与声明长度不匹配');
    }
    
    // 验证长度是否为14字节 (0x0E)
    if (length !== 14) {
        throw new Error('时间同步命令数据长度必须为14字节');
    }
    
    // 解析数据部分
    const data = packet.slice(2);
    
    // 解析时间字段 (每个字段2字节ASCII码格式)
    const timeFields = [];
    for (let i = 0; i < 7; i++) {
        const timeBuffer = data.slice(i * 2, (i + 1) * 2);
        // 分别解析每个字节
        const tens = timeBuffer[0] - 0x30; // 转换为数字
        const units = timeBuffer[1] - 0x30; // 转换为数字
        // 将两个数字组合成十进制数字
        const timeValue = tens * 10 + units;
        timeFields.push(timeValue);
    }
    
    return {
        functionCode,
        length,
        second: timeFields[0],
        minute: timeFields[1],
        hour: timeFields[2],
        day: timeFields[3],
        month: timeFields[4],
        week: timeFields[5],
        year: timeFields[6],
        rawData: {
            secondBuffer: data.slice(0, 2),
            minuteBuffer: data.slice(2, 4),
            hourBuffer: data.slice(4, 6),
            dayBuffer: data.slice(6, 8),
            monthBuffer: data.slice(8, 10),
            weekBuffer: data.slice(10, 12),
            yearBuffer: data.slice(12, 14)
        },
        isValid: functionCode === "15"
    };
}

/**
 * 生成当前时间的同步数据
 * @returns {Object} - 包含当前时间各个字段的对象
 */
function getCurrentTimeData() {
    const now = new Date();
    
    return {
        second: now.getSeconds(),
        minute: now.getMinutes(),
        hour: now.getHours(),
        day: now.getDate(),
        month: now.getMonth() + 1, // getMonth() 返回 0-11，需要加1
        week: now.getDay() === 0 ? 7 : now.getDay(), // getDay() 返回 0-6，0表示周日，需要转换为 1-7
        year: now.getFullYear() % 100 // 取年份的后两位
    };
}

export { generateTimeSyncPacket, parseTimeSyncPacket, getCurrentTimeData };

/* // 使用示例:

// 生成当前时间的同步命令包
const currentTimeData = getCurrentTimeData();
const currentTimeSyncCommand = generateTimeSyncPacket(15, currentTimeData);
console.log('当前时间同步命令包:', currentTimeSyncCommand.toString('hex'));


// 解析时间同步命令包
const commandPacket = Buffer.from('150e3137323530313134303830343235', 'hex');
const parsedCommand = parseTimeSyncPacket(commandPacket);
console.log('解析命令:', parsedCommand); */

