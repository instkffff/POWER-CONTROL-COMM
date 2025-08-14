// packet/unifiedPacket.js
import { bcdBufferToHexString, hexStringToBcdBuffer, bufferToInt1, intToBuffer1 } from './HEX.js';

/**
 * 生成命令数据包
 * @param {number} functionCode - 功能码 (默认18)
 * @param {Object} data - 数据对象
 * @param {string} data.hex - 十六进制字符串形式的数据 (如: "5555" 表示强制开机)
 * @returns {Buffer} - 完整的命令数据Buffer
 */
function HONgenerateCommandPacket(functionCode = 18, data) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString();
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 只处理hex格式数据
    const dataBuffer = Buffer.from(data.hex, 'hex');
    
    // 计算长度（字节数）
    const length = dataBuffer.length;
    const lengthBuffer = intToBuffer1(length);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer, dataBuffer]);
    
    return packet;
}

/**
 * 生成响应数据包
 * @param {number} functionCode - 功能码 (默认98)
 * @param {Object} data - 数据对象
 * @param {string} data.hex - 十六进制字符串形式的数据 (如: "55" 表示成功)
 * @returns {Buffer} - 完整的响应数据Buffer
 */
function HONgenerateResponsePacket(functionCode = 98, data) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString();
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 只处理hex格式数据
    const dataBuffer = Buffer.from(data.hex, 'hex');
    
    // 计算长度（字节数）
    const length = dataBuffer.length;
    const lengthBuffer = intToBuffer1(length);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer, dataBuffer]);
    
    return packet;
}

/**
 * 解析命令数据包
 * @param {Buffer} packet - 命令数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function HONparseCommandPacket(packet) {
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
 * 解析响应数据包
 * @param {Buffer} packet - 响应数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function HONparseResponsePacket(packet) {
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

export { 
    HONgenerateCommandPacket, 
    HONgenerateResponsePacket, 
    HONparseCommandPacket, 
    HONparseResponsePacket 
};

/* // 使用示例:

// 生成强制开机命令包 - 使用对象形式传入十六进制字符串
const forceOpenCommand = HONgenerateCommandPacket(18, { hex: "5555" });
console.log('强制开机命令包:', forceOpenCommand);

// 生成强制关机命令包 - 使用对象形式传入十六进制字符串
const forceHaltCommand = HONgenerateCommandPacket(18, { hex: "AAAA" });
console.log('强制关机命令包:', forceHaltCommand);

// 生成恢复正常命令包 - 使用对象形式传入十六进制字符串
const normalCommand = HONgenerateCommandPacket(18, { hex: "BBBB" });
console.log('恢复正常命令包:', normalCommand);

// 生成强制开机响应包 - 使用对象形式传入十六进制字符串
const forceOpenResponse = HONgenerateResponsePacket(98, { hex: "55" });
console.log('强制开机响应包:', forceOpenResponse);

// 解析强制开机命令包
const commandPacket = Buffer.from('18025555', 'hex');
const parsedCommand = HONparseCommandPacket(commandPacket);
console.log('解析命令:', parsedCommand);

// 解析强制开机响应包
const responsePacket = Buffer.from('980155', 'hex');
const parsedResponse = HONparseResponsePacket(responsePacket);
console.log('解析响应:', parsedResponse); */