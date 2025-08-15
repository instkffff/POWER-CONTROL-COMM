import { bcdBufferToHexString, hexStringToBcdBuffer, bufferToInt1, intToBuffer1, bufferToFloat, floatToBuffer } from './HEX.js';

/* send data

function code 02
length 00

recive data

function code 82 // 命令位 = 2 + 80
length 1C
kw/h 00 00 00 00 // 电量 KWh = float / 10 用途未知
kw/h 00 00 00 00 // 电量 KWh = float / 10 用途未知
kw/h 00 00 00 00 // 电量 KWh = float / 10 用途未知
kw/h 00 00 00 00 // 充值电量 KWh = float / 10
kw/h 00 00 C8 42 // 初始电量 KWh = float / 10
kw/h 00 00 00 00 // 使用电量 KWh = float / 10
kw/h 00 00 C8 42 // 总电量 KWh = float / 10
*/

/**
 * 生成读取电量命令数据包
 * @param {number} functionCode - 功能码 (默认2)
 * @param {Object} data - 数据部分（空对象）
 * @returns {Buffer} - 完整的命令数据Buffer
 */
function generateReadKWHPacket(functionCode = 2, data = {}) {
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
 * 解析读取电量命令数据包
 * @param {Buffer} packet - 命令数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseReadKWHPacket(packet) {
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
        throw new Error('读取电量命令长度必须为0');
    }
    
    // 验证包长度
    if (packet.length !== 2) {
        throw new Error('读取电量命令包长度不正确');
    }
    
    return {
        functionCode,
        length,
        isValid: functionCode === "02"
    };
}

/**
 * 生成读取电量响应数据包
 * @param {number} functionCode - 功能码 (默认82)
 * @param {Object} data - 电量数据
 * @param {number} data.unknown1 - 未知用途电量 (KWh = float / 10)
 * @param {number} data.unknown2 - 未知用途电量 (KWh = float / 10)
 * @param {number} data.unknown3 - 未知用途电量 (KWh = float / 10)
 * @param {number} data.rechargeKWH - 充值电量 (KWh = float / 10)
 * @param {number} data.initialKWH - 初始电量 (KWh = float / 10)
 * @param {number} data.usedKWH - 使用电量 (KWh = float / 10)
 * @param {number} data.totalKWH - 总电量 (KWh = float / 10)
 * @returns {Buffer} - 完整的响应数据Buffer
 */
function generateReadKWHResponse(functionCode = 82, data) {
    // 功能码转BCD格式Buffer
    const funcCodeHex = functionCode.toString().padStart(2, '0');
    const funcCodeBuffer = hexStringToBcdBuffer(funcCodeHex);
    
    // 处理各个电量数据
    const kwhBuffers = [];
    const kwhFields = [
        'unknown1', 'unknown2', 'unknown3', 'rechargeKWH',
        'initialKWH', 'usedKWH', 'totalKWH'
    ];
    
    for (const field of kwhFields) {
        let kwhBuffer;
        if (typeof data[field] === 'number') {
            // 如果是数字，转换为实际浮点数值并转为buffer
            const actualKWH = data[field] * 10;
            kwhBuffer = floatToBuffer(actualKWH);
        } else {
            // 如果已经是buffer
            kwhBuffer = data[field];
        }
        kwhBuffers.push(kwhBuffer);
    }
    
    // 数据部分
    const dataBuffer = Buffer.concat(kwhBuffers);
    
    // 计算长度（字节数）
    const length = dataBuffer.length;
    const lengthBuffer = intToBuffer1(length);
    
    // 组合完整数据包
    const packet = Buffer.concat([funcCodeBuffer, lengthBuffer, dataBuffer]);
    
    return packet;
}

/**
 * 解析读取电量响应数据包
 * @param {Buffer} packet - 响应数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseReadKWHResponse(packet) {
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
    
    // 验证长度是否为28字节 (0x1C)
    if (length !== 28) {
        throw new Error('读取电量响应数据长度必须为28字节');
    }
    
    // 解析数据部分
    const data = packet.slice(2);
    
    // 解析各电量字段 (每个字段4字节)
    const kwhFields = [];
    for (let i = 0; i < 7; i++) {
        const kwhBuffer = data.slice(i * 4, (i + 1) * 4);
        const kwhValue = bufferToFloat(kwhBuffer);
        const actualKWH = kwhValue / 10;
        kwhFields.push({
            buffer: kwhBuffer,
            value: actualKWH
        });
    }
    
    return {
        functionCode,
        length,
        unknown1: kwhFields[0].value,
        unknown2: kwhFields[1].value,
        unknown3: kwhFields[2].value,
        rechargeKWH: kwhFields[3].value,
        initialKWH: kwhFields[4].value,
        usedKWH: kwhFields[5].value,
        totalKWH: kwhFields[6].value,
        rawData: {
            unknown1Buffer: kwhFields[0].buffer,
            unknown2Buffer: kwhFields[1].buffer,
            unknown3Buffer: kwhFields[2].buffer,
            rechargeKWHBuffer: kwhFields[3].buffer,
            initialKWHBuffer: kwhFields[4].buffer,
            usedKWHBuffer: kwhFields[5].buffer,
            totalKWHBuffer: kwhFields[6].buffer
        },
        isValid: functionCode === "82"
    };
}

export { generateReadKWHPacket, parseReadKWHPacket, generateReadKWHResponse, parseReadKWHResponse };

/* // 使用示例:

// 生成读取电量命令包
const readKWHCommand = generateReadKWHPacket(2, {});
console.log('读取电量命令包:', readKWHCommand); // 应输出: "0200"

// 解析读取电量命令包
const commandPacket = Buffer.from('0200', 'hex');
const parsedCommand = parseReadKWHPacket(commandPacket);
console.log('解析命令:', parsedCommand);

// 生成读取电量响应包 (使用数字参数)
const readKWHResponse = generateReadKWHResponse(82, {
    unknown1: 0.0,
    unknown2: 0.0,
    unknown3: 0.0,
    rechargeKWH: 0.0,
    initialKWH: 100.0,  // 初始电量100KWh
    usedKWH: 0.0,      // 使用电量0KWh
    totalKWH: 100.0    // 总电量100KWh
});
console.log('读取电量响应包:', readKWHResponse);

// 解析读取电量响应包
const responsePacket = Buffer.from('821c000000000000000000000000000000000000c842000000000000c842', 'hex');
const parsedResponse = parseReadKWHResponse(responsePacket);
console.log('解析响应:', parsedResponse);
 */