// packet/unifiedPacket.js
import { bcdBufferToHexString, hexStringToBcdBuffer, bufferToInt1, intToBuffer1, bufferToFloat, floatToBuffer } from './HEX.js';

/* 
send data

function code 13
length 10
window powerA 00 00 00 00 // 窗口A功率 p = float / 10
window powerB 00 00 00 00 // 窗口B功率 p = float / 10
window factorA 00 00 C8 42 // 窗口系数A p = float / 1000
window factorB 00 00 C8 42 // 窗口系数B p = float / 1000

receive data

function code 93 // 命令位 13 + 80
length 01
data 55
*/

/**
 * 生成窗口设置命令数据包
 * @param {number} functionCode - 功能码 (默认13)
 * @param {Object} data - 窗口设置数据
 * @param {number} data.powerA - 窗口A功率 (float / 10)
 * @param {number} data.powerB - 窗口B功率 (float / 10)
 * @param {number} data.factorA - 窗口系数A (float / 1000)
 * @param {number} data.factorB - 窗口系数B (float / 1000)
 * @returns {Buffer} - 完整的命令数据Buffer
 */
function generateWindowSettingPacket(functionCode = 13, data) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString().padStart(2, '0');
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 默认值
    const defaultData = {
        powerA: 0.0,
        powerB: 0.0,
        factorA: 100.0,
        factorB: 100.0
    };
    
    // 合并传入数据和默认值
    const mergedData = { ...defaultData, ...data };
    
    // 处理窗口功率数据
    const powerABuffer = floatToBuffer(mergedData.powerA * 10);
    const powerBBuffer = floatToBuffer(mergedData.powerB * 10);
    
    // 处理窗口系数数据
    const factorABuffer = floatToBuffer(mergedData.factorA * 1000);
    const factorBBuffer = floatToBuffer(mergedData.factorB * 1000);
    
    // 数据部分
    const dataBuffer = Buffer.concat([
        powerABuffer,
        powerBBuffer,
        factorABuffer,
        factorBBuffer
    ]);
    
    // 计算长度（字节数）
    const length = dataBuffer.length;
    const lengthBuffer = intToBuffer1(length);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer, dataBuffer]);
    
    return packet;
}

/**
 * 解析窗口设置命令数据包
 * @param {Buffer} packet - 命令数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseWindowSettingPacket(packet) {
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
    
    // 验证长度是否为16字节 (0x10)
    if (length !== 16) {
        throw new Error('窗口设置命令数据长度必须为16字节');
    }
    
    // 解析数据部分
    const data = packet.slice(2);
    
    // 解析窗口功率字段 (每个字段4字节)
    const powerABuffer = data.slice(0, 4);
    const powerBBuffer = data.slice(4, 8);
    
    const powerA = bufferToFloat(powerABuffer) / 10;
    const powerB = bufferToFloat(powerBBuffer) / 10;
    
    // 解析窗口系数字段 (每个字段4字节)
    const factorABuffer = data.slice(8, 12);
    const factorBBuffer = data.slice(12, 16);
    
    const factorA = bufferToFloat(factorABuffer) / 1000;
    const factorB = bufferToFloat(factorBBuffer) / 1000;
    
    return {
        functionCode,
        length,
        powerA,
        powerB,
        factorA,
        factorB,
        rawData: {
            powerABuffer,
            powerBBuffer,
            factorABuffer,
            factorBBuffer
        },
        isValid: functionCode === "13"
    };
}

/**
 * 生成窗口设置响应数据包
 * @param {number} functionCode - 功能码 (默认93)
 * @param {Object} data - 数据部分
 * @param {string} data.hex - 十六进制字符串形式的数据 (如: "55" 表示成功)
 * @returns {Buffer} - 完整的响应数据Buffer
 */
function generateWindowSettingResponse(functionCode = 93, data) {
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
 * 解析窗口设置响应数据包
 * @param {Buffer} packet - 响应数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseWindowSettingResponse(packet) {
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
        isValid: functionCode === "93"
    };
}

export { generateWindowSettingPacket, parseWindowSettingPacket, generateWindowSettingResponse, parseWindowSettingResponse };

/* // 使用示例:

// 生成窗口设置命令包
const windowSettingCommand = generateWindowSettingPacket(13, {
    powerA: 0.0,      // 窗口A功率0W
    powerB: 0.0,      // 窗口B功率0W
    factorA: 100.0,   // 窗口系数A 100.0
    factorB: 100.0    // 窗口系数B 100.0
});
console.log('窗口设置命令包:', windowSettingCommand.toString('hex'));

// 解析窗口设置命令包
const commandPacket = Buffer.from('131000000000000000000000c8420000c842', 'hex');
const parsedCommand = parseWindowSettingPacket(commandPacket);
console.log('解析命令:', parsedCommand);

// 生成窗口设置响应包
const windowSettingResponse = generateWindowSettingResponse(93, { hex: "55" });
console.log('窗口设置响应包:', windowSettingResponse.toString('hex')); // 应输出: "930155"

// 解析窗口设置响应包
const responsePacket = Buffer.from('930155', 'hex');
const parsedResponse = parseWindowSettingResponse(responsePacket);
console.log('解析响应:', parsedResponse); */
