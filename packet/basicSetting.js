import { bcdBufferToHexString, hexStringToBcdBuffer, bufferToInt1, intToBuffer1, bufferToFloat, floatToBuffer } from './HEX.js';

/* 
send data

function code 11
length 18
total power 00 40 1C 46 // 总功率 p = float / 10
reactive power 00 80 3B 45 // 阻性功率 p = float / 10
active power 00 68 1C 46 // 上电功率 p = float / 10
inductor power 00 68 1C 46 // 感性功率 p = float / 10
delay1 3C 00 // 延时1 integer
delay2 3D 00 // 延时2 integer
delay3 3E 00 // 延时3 integer
retry 04 00 // 重试次数 integer

receive data

function code 91 // 命令位 11 + 80
length 01
data 55
*/


/**
 * 生成基本设置命令数据包
 * @param {number} functionCode - 功能码 (默认11)
 * @param {Object} data - 设置数据
 * @param {number} data.totalPower - 总功率 (float / 10)
 * @param {number} data.reactivePower - 阻性功率 (float / 10)
 * @param {number} data.activePower - 上电功率 (float / 10)
 * @param {number} data.inductorPower - 感性功率 (float / 10)
 * @param {number} data.delay1 - 延时1
 * @param {number} data.delay2 - 延时2
 * @param {number} data.delay3 - 延时3
 * @param {number} data.retry - 重试次数
 * @returns {Buffer} - 完整的命令数据Buffer
 */
function generateBasicSettingPacket(functionCode = 11, data = {
    totalPower: 1000.0,
    reactivePower: 400.0,
    activePower: 990.0,
    inductorPower: 990.0,
    delay1: 60,
    delay2: 61,
    delay3: 62,
    retry: 4
}) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString().padStart(2, '0');
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 处理浮点数数据
    const floatBuffers = [];
    const floatFields = ['totalPower', 'reactivePower', 'activePower', 'inductorPower'];
    
    for (const field of floatFields) {
        let floatBuffer;
        if (typeof data[field] === 'number') {
            // 如果是数字，转换为实际浮点数值并转为buffer
            const actualValue = data[field] * 10;
            floatBuffer = floatToBuffer(actualValue);
        } else {
            // 如果已经是buffer
            floatBuffer = data[field];
        }
        floatBuffers.push(floatBuffer);
    }
    
    // 处理整数数据
    const intBuffers = [];
    const intFields = ['delay1', 'delay2', 'delay3', 'retry'];
    
    for (const field of intFields) {
        let intBuffer;
        if (typeof data[field] === 'number') {
            // 如果是数字，转换为2字节小端序buffer
            intBuffer = Buffer.alloc(2);
            intBuffer.writeUInt16LE(data[field], 0);
        } else {
            // 如果已经是buffer
            intBuffer = data[field];
        }
        intBuffers.push(intBuffer);
    }
    
    // 数据部分
    const dataBuffer = Buffer.concat([
        ...floatBuffers,
        ...intBuffers
    ]);
    
    // 计算长度（字节数）
    const length = dataBuffer.length;
    const lengthBuffer = intToBuffer1(length);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer, dataBuffer]);
    
    return packet;
}

/**
 * 解析基本设置命令数据包
 * @param {Buffer} packet - 命令数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseBasicSettingPacket(packet) {
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
    
    // 验证长度是否为24字节 (0x1C)
    if (length !== 24) {
        throw new Error('基本设置命令数据长度必须为24字节');
    }
    
    // 解析数据部分
    const data = packet.slice(2);
    
    // 解析浮点数字段 (每个字段4字节)
    const totalPowerBuffer = data.slice(0, 4);
    const reactivePowerBuffer = data.slice(4, 8);
    const activePowerBuffer = data.slice(8, 12);
    const inductorPowerBuffer = data.slice(12, 16);
    
    const totalPower = bufferToFloat(totalPowerBuffer) / 10;
    const reactivePower = bufferToFloat(reactivePowerBuffer) / 10;
    const activePower = bufferToFloat(activePowerBuffer) / 10;
    const inductorPower = bufferToFloat(inductorPowerBuffer) / 10;
    
    // 解析整数字段 (每个字段2字节，小端序)
    const delay1Buffer = data.slice(16, 18);
    const delay2Buffer = data.slice(18, 20);
    const delay3Buffer = data.slice(20, 22);
    const retryBuffer = data.slice(22, 24);
    
    const delay1 = delay1Buffer.readUInt16LE(0);
    const delay2 = delay2Buffer.readUInt16LE(0);
    const delay3 = delay3Buffer.readUInt16LE(0);
    const retry = retryBuffer.readUInt16LE(0);
    
    return {
        functionCode,
        length,
        totalPower,
        reactivePower,
        activePower,
        inductorPower,
        delay1,
        delay2,
        delay3,
        retry,
        rawData: {
            totalPowerBuffer,
            reactivePowerBuffer,
            activePowerBuffer,
            inductorPowerBuffer,
            delay1Buffer,
            delay2Buffer,
            delay3Buffer,
            retryBuffer
        },
        isValid: functionCode === "11"
    };
}

/**
 * 生成基本设置响应数据包
 * @param {number} functionCode - 功能码 (默认91)
 * @param {Object} data - 数据部分
 * @param {string} data.hex - 十六进制字符串形式的数据 (如: "55" 表示成功)
 * @returns {Buffer} - 完整的响应数据Buffer
 */
function generateBasicSettingResponse(functionCode = 91, data = { hex: "55" }) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString().padStart(2, '0');
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
 * 解析基本设置响应数据包
 * @param {Buffer} packet - 响应数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseBasicSettingResponse(packet) {
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
        isValid: functionCode === "91"
    };
}

export { generateBasicSettingPacket, parseBasicSettingPacket, generateBasicSettingResponse, parseBasicSettingResponse };

/* // 使用示例:

// 生成基本设置命令包
const basicSettingCommand = generateBasicSettingPacket(11, {
    totalPower: 10000.0,    // 总功率10000W
    reactivePower: 4000.0,  // 阻性功率4000W
    activePower: 9900.0,    // 上电功率9900W
    inductorPower: 9900.0,  // 感性功率9900W
    delay1: 60,             // 延时1: 60
    delay2: 61,             // 延时2: 61
    delay3: 62,             // 延时3: 62
    retry: 4                // 重试次数: 4
});
console.log('基本设置命令包:', basicSettingCommand);

// 解析基本设置命令包
const commandPacket = Buffer.from('111800401C4600401C4600401C4600401C463C003C003C000500', 'hex');
const parsedCommand = parseBasicSettingPacket(commandPacket);
console.log('解析命令:', parsedCommand);

// 生成基本设置响应包
const basicSettingResponse = generateBasicSettingResponse(91, { hex: "55" });
console.log('基本设置响应包:', basicSettingResponse); // 应输出: "910155"

// 解析基本设置响应包
const responsePacket = Buffer.from('910155', 'hex');
const parsedResponse = parseBasicSettingResponse(responsePacket);
console.log('解析响应:', parsedResponse);
 */