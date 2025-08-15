import { bcdBufferToHexString, hexStringToBcdBuffer, bufferToInt1, intToBuffer1, bufferToFloat, floatToBuffer } from './HEX.js';

/* 
send data

function code 07
length 00

recive data

function code 87 // 命令位 = 7 + 80
length 10
status code 01 00 // 正常开机 : 01 00 强制开机 : 02 00 关机 : 00 00
reason code 00 00 // 电量空 : 04 00 时段关机 : 05 00 强制关机 : 06 00 已锁定 : 07 00 未断电 00 00 未知状态 : 08 00   
voltage D1 D6 0C 45 // 电压 v = float / 10
current 8F C2 A6 43 // 电流 i = float / 1000
power 30 5D 6B 42 // 额定功率 p = float / 10 感性功率采样 p = vi 

*/

/**
 * 生成读取状态命令数据包
 * @param {number} functionCode - 功能码 (默认7)
 * @param {Object} data - 数据部分（空对象）
 * @returns {Buffer} - 完整的命令数据Buffer
 */
function generateReadStatusPacket(functionCode = 7, data = {}) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString().padStart(2, '0');
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 长度为0
    const lengthBuffer = intToBuffer1(0);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer]);
    
    return packet;
}

/**
 * 解析读取状态命令数据包
 * @param {Buffer} packet - 命令数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseReadStatusPacket(packet) {
    if (packet.length < 2) {
        throw new Error('命令数据包长度不足');
    }
    
    // 解析功能码（BCD格式）
    const functionCodeBuffer = packet.slice(0, 1);
    const functionCode = bcdBufferToHexString(functionCodeBuffer);
    
    // 解析长度
    const lengthBuffer = packet.slice(1, 2);
    const length = bufferToInt1(lengthBuffer);
    
    // 验证长度是否为0
    if (length !== 0) {
        throw new Error('读取状态命令长度必须为0');
    }
    
    // 验证包长度
    if (packet.length !== 2) {
        throw new Error('读取状态命令包长度不正确');
    }
    
    return {
        functionCode,
        length,
        isValid: functionCode === "07"
    };
}

/**
 * 生成读取状态响应数据包
 * @param {number} functionCode - 功能码 (默认87)
 * @param {Object} data - 状态数据
 * @param {number} data.statusCode - 状态码 (0=关机, 1=正常开机, 2=强制开机)
 * @param {number} data.reasonCode - 原因码 (0=未断电, 4=电量空, 5=时段关机, 6=强制关机, 7=已锁定, 8=未知状态)
 * @param {number} data.voltage - 电压值 (float / 10)
 * @param {number} data.current - 电流值 (float / 1000)
 * @param {number} data.power - 功率值 (float / 10)
 * @returns {Buffer} - 完整的响应数据Buffer
 */
function generateReadStatusResponse(functionCode = 87, data) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString().padStart(2, '0');
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 处理状态码和原因码
    let statusCodeBuffer, reasonCodeBuffer;
    
    if (typeof data.statusCode === 'number') {
        // 如果是数字，转换为Buffer (小端序)
        statusCodeBuffer = Buffer.from([data.statusCode, 0x00]);
    } else {
        // 如果已经是buffer
        statusCodeBuffer = data.statusCode;
    }
    
    if (typeof data.reasonCode === 'number') {
        // 如果是数字，转换为Buffer (小端序)
        reasonCodeBuffer = Buffer.from([data.reasonCode, 0x00]);
    } else {
        // 如果已经是buffer
        reasonCodeBuffer = data.reasonCode;
    }
    
    // 处理浮点数数据
    let voltageBuffer, currentBuffer, powerBuffer;
    
    if (typeof data.voltage === 'number') {
        // 如果是数字，转换为实际浮点数值并转为buffer
        const actualVoltage = data.voltage * 10;
        voltageBuffer = floatToBuffer(actualVoltage);
    } else {
        // 如果已经是buffer
        voltageBuffer = data.voltage;
    }
    
    if (typeof data.current === 'number') {
        // 如果是数字，转换为实际浮点数值并转为buffer
        const actualCurrent = data.current * 1000;
        currentBuffer = floatToBuffer(actualCurrent);
    } else {
        // 如果已经是buffer
        currentBuffer = data.current;
    }
    
    if (typeof data.power === 'number') {
        // 如果是数字，转换为实际浮点数值并转为buffer
        const actualPower = data.power * 10;
        powerBuffer = floatToBuffer(actualPower);
    } else {
        // 如果已经是buffer
        powerBuffer = data.power;
    }
    
    // 数据部分
    const dataBuffer = Buffer.concat([
        statusCodeBuffer,
        reasonCodeBuffer,
        voltageBuffer,
        currentBuffer,
        powerBuffer
    ]);
    
    // 计算长度（字节数）
    const length = dataBuffer.length;
    const lengthBuffer = intToBuffer1(length);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer, dataBuffer]);
    
    return packet;
}

/**
 * 解析读取状态响应数据包
 * @param {Buffer} packet - 响应数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseReadStatusResponse(packet) {
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
    
    // 验证长度是否为16字节
    if (length !== 16) {
        throw new Error('读取状态响应数据长度必须为16字节');
    }
    
    // 解析数据部分
    const data = packet.slice(2);
    
    // 解析各字段
    const statusCodeBuffer = data.slice(0, 2);
    const reasonCodeBuffer = data.slice(2, 4);
    const voltageBuffer = data.slice(4, 8);
    const currentBuffer = data.slice(8, 12);
    const powerBuffer = data.slice(12, 16);
    
    // 转换状态码和原因码(小端序)
    const statusCode = statusCodeBuffer[0];
    const reasonCode = reasonCodeBuffer[0];
    
    // 转换浮点数
    const voltage = bufferToFloat(voltageBuffer);
    const current = bufferToFloat(currentBuffer);
    const power = bufferToFloat(powerBuffer);
    
    // 实际值计算
    const actualVoltage = voltage / 10;
    const actualCurrent = current / 1000;
    const actualPower = power / 10;
    
    return {
        functionCode,
        length,
        statusCode,
        reasonCode,
        voltage: actualVoltage,
        current: actualCurrent,
        power: actualPower,
        rawData: {
            statusCodeBuffer,
            reasonCodeBuffer,
            voltageBuffer,
            currentBuffer,
            powerBuffer
        },
        isValid: functionCode === "87"
    };
}

export { generateReadStatusPacket, parseReadStatusPacket, generateReadStatusResponse, parseReadStatusResponse };

/* // 使用示例:

// 生成读取状态命令包
const readStatusCommand = generateReadStatusPacket(7, {});
console.log('读取状态命令包:', readStatusCommand); // 应输出: "0700"

// 解析读取状态命令包
const commandPacket = Buffer.from('0700', 'hex');
const parsedCommand = parseReadStatusPacket(commandPacket);
console.log('解析命令:', parsedCommand);

// 生成读取状态响应包 (使用数字参数)
const readStatusResponse = generateReadStatusResponse(87, {
    statusCode: 1,    // 正常开机
    reasonCode: 0,    // 未断电
    voltage: 25.3,    // 实际电压25.3V
    current: 1.3,     // 实际电流1.3A
    power: 12.5       // 实际功率12.5W
});
console.log('读取状态响应包:', readStatusResponse);

// 解析读取状态响应包
const responsePacket = Buffer.from('871001000000d1d60c458fc2a643305d6b42', 'hex');
const parsedResponse = parseReadStatusResponse(responsePacket);
console.log('解析响应:', parsedResponse);
 */