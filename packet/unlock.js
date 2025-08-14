import { bcdBufferToHexString, hexStringToBcdBuffer, bufferToInt1, intToBuffer1 } from './HEX.js';

/* 
send data

function code 19 // 命令位
length 02 // 包长度
data AA AA // 数据

recive data

function code 99 // 命令位 = 19 + 80
length 01
data 55 
*/

/**
 * 生成解锁命令数据包
 * @param {number} functionCode - 功能码 (默认19)
 * @param {Object} data - 数据部分
 * @param {string} data.hex - 十六进制字符串形式的数据 (如: "AAAA" 表示解锁数据)
 * @returns {Buffer} - 完整的命令数据Buffer
 */
function generateUnlockPacket(functionCode = 19, data = { hex: "AAAA" }) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString();
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 处理数据部分
    let dataBuffer;
    if (data.hex) {
        // 十六进制字符串形式
        dataBuffer = Buffer.from(data.hex, 'hex');
    } else {
        // 默认解锁数据
        dataBuffer = Buffer.from([0xAA, 0xAA]);
    }
    
    // 计算长度（字节数）
    const length = dataBuffer.length;
    const lengthBuffer = intToBuffer1(length);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer, dataBuffer]);
    
    return packet;
}

/**
 * 解析解锁命令数据包
 * @param {Buffer} packet - 命令数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseUnlockPacket(packet) {
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
        isValid: functionCode === "19"
    };
}

/**
 * 生成解锁响应数据包
 * @param {number} functionCode - 功能码 (默认99)
 * @param {Object} data - 数据部分
 * @param {string} data.hex - 十六进制字符串形式的数据 (如: "55" 表示成功)
 * @returns {Buffer} - 完整的响应数据Buffer
 */
function generateUnlockResponse(functionCode = 99, data = { hex: "55" }) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString();
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 处理数据部分
    let dataBuffer;
    if (data.hex) {
        // 十六进制字符串形式
        dataBuffer = Buffer.from(data.hex, 'hex');
    } else {
        // 默认成功响应
        dataBuffer = Buffer.from([0x55]);
    }
    
    // 计算长度（字节数）
    const length = dataBuffer.length;
    const lengthBuffer = intToBuffer1(length);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer, dataBuffer]);
    
    return packet;
}

/**
 * 解析解锁响应数据包
 * @param {Buffer} packet - 响应数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseUnlockResponse(packet) {
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
        isValid: functionCode === "99"
    };
}

export { generateUnlockPacket, parseUnlockPacket, generateUnlockResponse, parseUnlockResponse }; 

/* // 使用示例:

// 生成解锁命令包
const unlockCommand = generateUnlockPacket(19, { hex: "AAAA" });
console.log('解锁命令包:', unlockCommand); // 应输出: "1902aaaa"

// 解析解锁命令包
const commandPacket = Buffer.from('1902aaaa', 'hex');
const parsedCommand = parseUnlockPacket(commandPacket);
console.log('解析命令:', parsedCommand);

// 生成解锁响应包
const unlockResponse = generateUnlockResponse(99, { hex: "55" });
console.log('解锁响应包:', unlockResponse); // 应输出: "990155"

// 解析解锁响应包
const responsePacket = Buffer.from('990155', 'hex');
const parsedResponse = parseUnlockResponse(responsePacket);
console.log('解析响应:', parsedResponse);

 */