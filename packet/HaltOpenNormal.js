// packet/unifiedPacket.js
import { bcdBufferToHexString, hexStringToBcdBuffer, bufferToInt1, intToBuffer1 } from './HEX.js';

// 定义各功能类型的配置
const FUNCTION_CONFIGS = {
    forceOpen: {
        commandData: [0x55, 0x55],
        responseData: [0x55]
    },
    forceHalt: {
        commandData: [0xAA, 0xAA],
        responseData: [0x55]
    },
    normal: {
        commandData: [0xBB, 0xBB],
        responseData: [0x55]
    }
};

/**
 * 生成命令数据包
 * @param {string} functionName - 功能名称 ('forceOpen', 'forceHalt', 'normal')
 * @param {number} functionCode - 功能码 (默认18)
 * @returns {Buffer} - 完整的命令数据Buffer
 */
function HONgenerateCommandPacket(functionName, functionCode = 18) {
    const config = FUNCTION_CONFIGS[functionName];
    if (!config) {
        throw new Error(`不支持的功能名称: ${functionName}`);
    }
    
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString();
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 使用对应功能的命令数据
    const dataBuffer = Buffer.from(config.commandData);
    
    // 计算长度（字节数）
    const length = dataBuffer.length;
    const lengthBuffer = intToBuffer1(length);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer, dataBuffer]);
    
    return packet;
}

/**
 * 生成响应数据包
 * @param {string} functionName - 功能名称 ('forceOpen', 'forceHalt', 'normal')
 * @param {number} functionCode - 功能码 (默认98)
 * @returns {Buffer} - 完整的响应数据Buffer
 */
function HONgenerateResponsePacket(functionName, functionCode = 98) {
    const config = FUNCTION_CONFIGS[functionName];
    if (!config) {
        throw new Error(`不支持的功能名称: ${functionName}`);
    }
    
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString();
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 使用对应功能的响应数据
    const dataBuffer = Buffer.from(config.responseData);
    
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

/* // 生成强制开机命令包
const forceOpenCommand = HONgenerateCommandPacket('forceOpen');
console.log('强制开机命令包:', forceOpenCommand);

// 生成强制关机命令包
const forceHaltCommand = HONgenerateCommandPacket('forceHalt');
console.log('强制关机命令包:', forceHaltCommand);

// 生成恢复正常命令包
const normalCommand = HONgenerateCommandPacket('normal');
console.log('恢复正常命令包:', normalCommand);

// 生成强制开机响应包
const forceOpenResponse = HONgenerateResponsePacket('forceOpen');
console.log('强制开机响应包:', forceOpenResponse);

// 生成强制关机响应包
const forceHaltResponse = HONgenerateResponsePacket('forceHalt');
console.log('强制关机响应包:', forceHaltResponse);

// 生成恢复正常响应包
const normalResponse = HONgenerateResponsePacket('normal');
console.log('恢复正常响应包:', normalResponse);

// 解析命令包
const commandPacket = Buffer.from('18025555', 'hex');
const parsedCommand = HONparseCommandPacket(commandPacket);
console.log('解析命令:', parsedCommand);

// 解析响应包
const responsePacket = Buffer.from('980155', 'hex');
const parsedResponse = HONparseResponsePacket(responsePacket);
console.log('解析响应:', parsedResponse); */