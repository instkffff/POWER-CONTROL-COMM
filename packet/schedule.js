// packet/unifiedPacket.js
import { bcdBufferToHexString, hexStringToBcdBuffer, bufferToInt1, intToBuffer1, bufferToFloat, floatToBuffer } from './HEX.js';

/* send data

function code 14
length 23
period 01 // 时段1 : 01 时段2 : 02 时段3 : 03 时段4 : 04 时段5 : 05 时段6 : 06 时段7 : 07
mode 01 00 // 时段工作模式 小功率 : 02 00 开关机 : 01 00 无模式 : 00 00
power 00 00 00 00 // 时段功率 p = float / 10 仅小功率模式生效
monday period halt 00 00 // 周一 闭电时间 时 分
monday period open 05 1E // 周一 上电时间 时 分
tuesday period halt 00 00 // 周二 闭电时间 时 分
tuesday period open 05 1E // 周二 上电时间 时 分
wednesday period halt 00 00 // 周三 闭电时间 时 分
wednesday period open 05 1E // 周三 上电时间 时 分
thursday period halt 00 00 // 周四 闭电时间 时 分
thursday period open 05 1E // 周四 上电时间 时 分
friday period halt 00 00 // 周五 闭电时间 时 分
friday period open 05 1E // 周五 上电时间 时 分
saturday period halt 00 00 // 周六 闭电时间 时 分
saturday period open 05 1E // 周六 上电时间 时 分
sunday period halt 00 00 // 周日 闭电时间 时 分
sunday period open 05 1E // 周日 上电时间 时 分

receive data

function code 94 // 命令位 14 + 80
length 01
data 55
*/

/**
 * 生成时段设置命令数据包
 * @param {number} functionCode - 功能码 (默认14)
 * @param {Object} data - 时段设置数据
 * @param {number} data.period - 时段编号 (1-7)
 * @param {number} data.mode - 时段工作模式 (0=无模式, 1=开关机, 2=小功率)
 * @param {number} data.power - 时段功率 (float / 10, 仅小功率模式生效)
 * @param {Array<Object>} data.weekSchedule - 一周的时段安排
 * @returns {Buffer} - 完整的命令数据Buffer
 */
function generateSchedulePacket(functionCode = 14, data) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString().padStart(2, '0');
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 时段编号
    const periodBuffer = intToBuffer1(data.period);
    
    // 处理模式数据
    const modeBuffer = Buffer.alloc(2);
    modeBuffer.writeUInt16LE(data.mode, 0);
    
    // 处理功率数据
    const actualValue = data.power * 10;
    const powerBuffer = floatToBuffer(actualValue);
    
    // 处理一周的时段安排
    const weekBuffers = [];
    for (const day of data.weekSchedule) {
        const haltBuffer = Buffer.from([day.haltHour, day.haltMinute]);
        const openBuffer = Buffer.from([day.openHour, day.openMinute]);
        weekBuffers.push(haltBuffer, openBuffer);
    }
    
    // 数据部分
    const dataBuffer = Buffer.concat([
        periodBuffer,
        modeBuffer,
        powerBuffer,
        ...weekBuffers
    ]);
    
    // 计算长度（字节数）
    const length = dataBuffer.length;
    const lengthBuffer = intToBuffer1(length);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer, dataBuffer]);
    
    return packet;
}

/**
 * 解析时段设置命令数据包
 * @param {Buffer} packet - 命令数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseSchedulePacket(packet) {
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
    
    // 验证长度是否为35字节 (0x23)
    if (length !== 35) {
        throw new Error('时段设置命令数据长度必须为35字节');
    }
    
    // 解析数据部分
    const data = packet.slice(2);
    
    // 解析时段编号
    const period = data[0];
    
    // 解析模式 (2字节，小端序)
    const modeBuffer = data.slice(1, 3);
    const mode = modeBuffer.readUInt16LE(0);
    
    // 解析功率 (4字节)
    const powerBuffer = data.slice(3, 7);
    const power = bufferToFloat(powerBuffer) / 10;
    
    // 解析一周的时段安排 (每天4字节: 闭电时间2字节 + 上电时间2字节)
    const weekSchedule = [];
    for (let i = 0; i < 7; i++) {
        const dayOffset = 7 + (i * 4);
        const haltHour = data[dayOffset];
        const haltMinute = data[dayOffset + 1];
        const openHour = data[dayOffset + 2];
        const openMinute = data[dayOffset + 3];
        
        weekSchedule.push({
            haltHour,
            haltMinute,
            openHour,
            openMinute
        });
    }
    
    return {
        functionCode,
        length,
        period,
        mode,
        power,
        weekSchedule,
        rawData: {
            periodBuffer: data.slice(0, 1),
            modeBuffer,
            powerBuffer,
            weekBuffer: data.slice(7)
        },
        isValid: functionCode === "14"
    };
}

/**
 * 生成时段设置响应数据包
 * @param {number} functionCode - 功能码 (默认94)
 * @param {Object} data - 数据部分
 * @param {string} data.hex - 十六进制字符串形式的数据 (如: "55" 表示成功)
 * @returns {Buffer} - 完整的响应数据Buffer
 */
function generateScheduleResponse(functionCode = 94, data) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString().padStart(2, '0');
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 处理数据部分 - 只处理hex格式数据
    const dataBuffer = Buffer.from(data.hex, 'hex')
    
    // 计算长度（字节数）
    const length = dataBuffer.length;
    const lengthBuffer = intToBuffer1(length);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer, dataBuffer]);
    
    return packet;
}

/**
 * 解析时段设置响应数据包
 * @param {Buffer} packet - 响应数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseScheduleResponse(packet) {
    if (packet.length < 2) {
        throw new Error('响应数据包长度不足');
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
    
    // 解析数据
    const data = packet.slice(2);
    
    return {
        functionCode,
        length,
        data,
        isValid: functionCode === "94"
    };
}

export { generateSchedulePacket, parseSchedulePacket, generateScheduleResponse, parseScheduleResponse };

// 使用示例:

/* // 生成时段设置命令包
const scheduleCommand = generateSchedulePacket(14, {
    period: 1,
    mode: 1,  // 开关机模式
    power: 0.0,
    weekSchedule: [
        { haltHour: 0, haltMinute: 0, openHour: 7, openMinute: 30 }, // 周一
        { haltHour: 0, haltMinute: 0, openHour: 6, openMinute: 30 }, // 周二
        { haltHour: 0, haltMinute: 0, openHour: 5, openMinute: 30 }, // 周三
        { haltHour: 0, haltMinute: 0, openHour: 4, openMinute: 30 }, // 周四
        { haltHour: 0, haltMinute: 0, openHour: 3, openMinute: 30 }, // 周五
        { haltHour: 0, haltMinute: 0, openHour: 2, openMinute: 30 }, // 周六
        { haltHour: 0, haltMinute: 0, openHour: 1, openMinute: 30 }  // 周日
    ]
});
console.log('时段设置命令包:', scheduleCommand.toString('hex'));

// 解析时段设置命令包
const commandPacket = Buffer.from('1423010100000000000000071e0000061e0000051e0000041e0000031e0000021e0000011e', 'hex');
const parsedCommand = parseSchedulePacket(commandPacket);
console.log('解析命令:', parsedCommand);

// 生成时段设置响应包
const scheduleResponse = generateScheduleResponse(94, { hex: "55" });
console.log('时段设置响应包:', scheduleResponse.toString('hex')); // 应输出: "940155"

// 解析时段设置响应包
const responsePacket = Buffer.from('940155', 'hex');
const parsedResponse = parseScheduleResponse(responsePacket);
console.log('解析响应:', parsedResponse);
 */