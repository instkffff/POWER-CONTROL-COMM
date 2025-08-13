import { bcdBufferToHexString, hexStringToBcdBuffer, bufferToInt1, intToBuffer1 } from './HEX.js';

/* send data

function code 18
length 02
data 55 55

recive data // 返回同强制关机

function code 98 // 命令位 = 18 + 80
length 01
data 55
*/

/**
 * 生成强制开机命令数据包
 * @param {number} functionCode - 功能码 (默认18)
 * @param {Buffer|Array<number>} data - 数据部分
 * @returns {Buffer} - 完整的命令数据Buffer
 */
function generateForceOpenPacket(functionCode = 18, data = Buffer.from([0x55, 0x55])) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString();
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 处理数据部分
    let dataBuffer;
    if (Buffer.isBuffer(data)) {
        // 如果数据是Buffer
        dataBuffer = data;
    } else if (Array.isArray(data)) {
        // 如果数据是字节数组
        dataBuffer = Buffer.from(data);
    }
    
    // 计算长度（字节数）
    const length = dataBuffer.length;
    const lengthBuffer = intToBuffer1(length);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer, dataBuffer]);
    
    return packet;
}

/**
 * 解析强制开机命令数据包
 * @param {Buffer} packet - 命令数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseForceOpenPacket(packet) {
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
    
    // 解析数据
    const data = packet.slice(2);
    
    return {
        functionCode,
        length,
        data,
        isValid: functionCode === "18"
    };
}

/**
 * 生成强制开机响应数据包
 * @param {number} functionCode - 功能码 (默认98)
 * @param {Buffer|Array<number>} data - 数据部分
 * @returns {Buffer} - 完整的响应数据Buffer
 */
function generateForceOpenResponse(functionCode = 98, data = Buffer.from([0x55])) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString();
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 处理数据部分
    let dataBuffer;
    if (Buffer.isBuffer(data)) {
        // 如果数据是Buffer
        dataBuffer = data;
    } else if (Array.isArray(data)) {
        // 如果数据是字节数组
        dataBuffer = Buffer.from(data);
    }
    
    // 计算长度（字节数）
    const length = dataBuffer.length;
    const lengthBuffer = intToBuffer1(length);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer, dataBuffer]);
    
    return packet;
}

/**
 * 解析强制开机响应数据包
 * @param {Buffer} packet - 响应数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseForceOpenResponse(packet) {
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
        isValid: functionCode === "98"
    };
}

export { generateForceOpenPacket, parseForceOpenPacket, generateForceOpenResponse, parseForceOpenResponse };

/* // 使用示例:

// 生成强制开机命令包
const forceOpenCommand = generateForceOpenPacket();
console.log('强制开机命令包:', forceOpenCommand); // 应输出: "18025555"

// 解析强制开机命令包
const commandPacket = Buffer.from('18025555', 'hex');
const parsedCommand = parseForceOpenPacket(commandPacket);
console.log('解析命令:', parsedCommand);

// 生成强制开机响应包
const forceOpenResponse = generateForceOpenResponse();
console.log('强制开机响应包:', forceOpenResponse); // 应输出: "980155"

// 解析强制开机响应包
const responsePacket = Buffer.from('980155', 'hex');
const parsedResponse = parseForceOpenResponse(responsePacket);
console.log('解析响应:', parsedResponse); */

