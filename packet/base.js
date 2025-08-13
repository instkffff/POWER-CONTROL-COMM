import { bufferToFloat, floatToBuffer, bcdBufferToHexString, hexStringToBcdBuffer, bufferToInt1, bufferToInt2, intToBuffer1, intToBuffer2 } from './HEX.js';

// 发送包生成

/* 
header : 68 固定头 
ID : 80 13 10 不固定 使用 bcdBufferToHexString 逐位转换拼接 输入是数字
fill : AA AA AA 固定填充
header2 : 68 固定
data : 由其它函数生成 传入合并进来
check : sum8 校验 范围从0开始 到校验前一位 丢弃进位
tail : 16 固定
*/

/**
 * 生成数据包
 * @param {number} id - 设备ID (6位数字)
 * @param {Buffer} data - 数据部分的Buffer
 * @returns {Buffer} - 完整的数据包Buffer
 */
function generatePacket(id, data) {
    // 固定头部和尾部
    const header = Buffer.from([0x68]);
    const fill = Buffer.from([0xAA, 0xAA, 0xAA]);
    const header2 = Buffer.from([0x68]);
    const tail = Buffer.from([0x16]);
    
    // ID处理：将6位ID分成3组，每组2位数字
    const idStr = id.toString().padStart(6, '0'); // 确保是6位数字
    const idBuffers = [];
    
    // 每2位数字组成一个BCD字节
    for (let i = 0; i < 6; i += 2) {
        const twoDigits = idStr.substring(i, i + 2);
        // 将两位数字组成的字符串转换为十六进制表示的BCD码
        const bcdValue = parseInt(twoDigits, 16);
        idBuffers.push(Buffer.from([bcdValue]));
    }
    const idBuffer = Buffer.concat(idBuffers);
    
    // 构建完整数据包（校验前的部分）
    const packetWithoutCheck = Buffer.concat([header, idBuffer, fill, header2, data]);
    
    // 计算校验和（sum8校验，丢弃进位）
    let checksum = 0;
    for (let i = 0; i < packetWithoutCheck.length; i++) {
        checksum += packetWithoutCheck[i];
    }
    // 丢弃进位，只保留低8位
    checksum = checksum & 0xFF;
    const check = intToBuffer1(checksum);
    
    // 组合完整数据包
    const fullPacket = Buffer.concat([packetWithoutCheck, check, tail]);
    
    return fullPacket;
}

// 返回包生成

/* 
header : FF FF FF 固定头
header2 : 68 固定
ID : 80 13 10 不固定 使用 bcdBufferToHexString 逐位转换拼接 输入是数字
fill : AA AA AA 固定填充
header3 : 68 固定
data : 由其它函数生成 传入合并进来
check : sum8 校验 范围从 header2 开始 到校验前一位 丢弃进位
tail : 16 固定
*/

/**
 * 生成返回数据包
 * @param {number} id - 设备ID (6位数字)
 * @param {Buffer} data - 数据部分的Buffer
 * @returns {Buffer} - 完整的返回数据包Buffer
 */
function generateResponsePacket(id, data) {
    // 固定头部和尾部
    const header = Buffer.from([0xFF, 0xFF, 0xFF]);
    const header2 = Buffer.from([0x68]);
    const fill = Buffer.from([0xAA, 0xAA, 0xAA]);
    const header3 = Buffer.from([0x68]);
    const tail = Buffer.from([0x16]);
    
    // ID处理：将6位ID分成3组，每组2位数字
    const idStr = id.toString().padStart(6, '0'); // 确保是6位数字
    const idBuffers = [];
    
    // 每2位数字组成一个BCD字节
    for (let i = 0; i < 6; i += 2) {
        const twoDigits = idStr.substring(i, i + 2);
        // 将两位数字组成的字符串转换为十六进制表示的BCD码
        const bcdValue = parseInt(twoDigits, 16);
        idBuffers.push(Buffer.from([bcdValue]));
    }
    const idBuffer = Buffer.concat(idBuffers);
    
    // 构建数据包（从header2到data部分，用于校验计算）
    const packetContent = Buffer.concat([header2, idBuffer, fill, header3, data]);
    
    // 计算校验和（sum8校验，从header2开始到校验前一位，丢弃进位）
    let checksum = 0;
    for (let i = 0; i < packetContent.length; i++) {
        checksum += packetContent[i];
    }
    // 丢弃进位，只保留低8位
    checksum = checksum & 0xFF;
    const check = intToBuffer1(checksum);
    
    // 组合完整数据包
    const fullPacket = Buffer.concat([header, packetContent, check, tail]);
    
    return fullPacket;
}

/**
 * 解析数据包
 * @param {Buffer} packet - 完整的数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parsePacket(packet) {
    // 验证包长度
    if (packet.length < 10) { // 最小包长度
        throw new Error('数据包长度不足');
    }
    
    let offset = 0;
    
    // 解析header (1字节)
    const header = packet.slice(offset, offset + 1);
    offset += 1;
    if (header[0] !== 0x68) {
        throw new Error('数据包头不正确');
    }
    
    // 解析ID (3字节)
    const idBuffer = packet.slice(offset, offset + 3);
    offset += 3;
    
    // 将BCD格式的ID转换回数字
    let idStr = '';
    for (let i = 0; i < 3; i++) {
        const bcdByte = idBuffer[i];
        // 将BCD字节转换为两位数字
        const highDigit = (bcdByte >> 4) & 0xF;
        const lowDigit = bcdByte & 0xF;
        idStr += highDigit.toString() + lowDigit.toString();
    }
    const id = parseInt(idStr, 10);
    
    // 解析fill (3字节)
    const fill = packet.slice(offset, offset + 3);
    offset += 3;
    if (fill[0] !== 0xAA || fill[1] !== 0xAA || fill[2] !== 0xAA) {
        throw new Error('填充字段不正确');
    }
    
    // 解析header2 (1字节)
    const header2 = packet.slice(offset, offset + 1);
    offset += 1;
    if (header2[0] !== 0x68) {
        throw new Error('第二个包头不正确');
    }
    
    // 解析data (到校验位前)
    const dataEndIndex = packet.length - 2; // 校验(1字节) + tail(1字节) = 2字节
    const data = packet.slice(offset, dataEndIndex);
    offset = dataEndIndex;
    
    // 解析校验和 (1字节)
    const check = packet.slice(offset, offset + 1);
    offset += 1;
    
    // 验证校验和
    const packetWithoutCheck = packet.slice(0, packet.length - 2);
    let checksum = 0;
    for (let i = 0; i < packetWithoutCheck.length; i++) {
        checksum += packetWithoutCheck[i];
    }
    checksum = checksum & 0xFF;
    const calculatedCheck = intToBuffer1(checksum);
    
    if (check[0] !== calculatedCheck[0]) {
        throw new Error(`校验和不匹配: 期望 ${calculatedCheck[0].toString(16)}, 实际 ${check[0].toString(16)}`);
    }
    
    // 解析tail (1字节)
    const tail = packet.slice(offset, offset + 1);
    if (tail[0] !== 0x16) {
        throw new Error('包尾不正确');
    }
    
    return {
        header,
        id,
        fill,
        header2,
        data,
        check,
        tail,
        isValid: true
    };
}

/**
 * 解析返回数据包
 * @param {Buffer} packet - 完整的返回数据包Buffer
 * @returns {Object} - 解析结果对象
 */
function parseResponsePacket(packet) {
    // 验证包长度
    if (packet.length < 13) { // 最小包长度 (FFFFFF + 68 + ID(3) + AAAAAA + 68 + check(1) + 16(1) = 13)
        throw new Error('返回数据包长度不足');
    }
    
    let offset = 0;
    
    // 解析header (3字节)
    const header = packet.slice(offset, offset + 3);
    offset += 3;
    if (header[0] !== 0xFF || header[1] !== 0xFF || header[2] !== 0xFF) {
        throw new Error('返回数据包头不正确');
    }
    
    // 解析header2 (1字节)
    const header2 = packet.slice(offset, offset + 1);
    offset += 1;
    if (header2[0] !== 0x68) {
        throw new Error('返回数据包第二个包头不正确');
    }
    
    // 解析ID (3字节)
    const idBuffer = packet.slice(offset, offset + 3);
    offset += 3;
    
    // 将BCD格式的ID转换回数字
    let idStr = '';
    for (let i = 0; i < 3; i++) {
        const bcdByte = idBuffer[i];
        // 将BCD字节转换为两位数字
        const highDigit = (bcdByte >> 4) & 0xF;
        const lowDigit = bcdByte & 0xF;
        idStr += highDigit.toString() + lowDigit.toString();
    }
    const id = parseInt(idStr, 10);
    
    // 解析fill (3字节)
    const fill = packet.slice(offset, offset + 3);
    offset += 3;
    if (fill[0] !== 0xAA || fill[1] !== 0xAA || fill[2] !== 0xAA) {
        throw new Error('返回数据包填充字段不正确');
    }
    
    // 解析header3 (1字节)
    const header3 = packet.slice(offset, offset + 1);
    offset += 1;
    if (header3[0] !== 0x68) {
        throw new Error('返回数据包第三个包头不正确');
    }
    
    // 解析data (到校验位前)
    const dataEndIndex = packet.length - 2; // 校验(1字节) + tail(1字节) = 2字节
    const data = packet.slice(offset, dataEndIndex);
    offset = dataEndIndex;
    
    // 解析校验和 (1字节)
    const check = packet.slice(offset, offset + 1);
    offset += 1;
    
    // 验证校验和 (从header2开始计算)
    const packetContent = packet.slice(3, packet.length - 2); // 从第二个68开始到校验前
    let checksum = 0;
    for (let i = 0; i < packetContent.length; i++) {
        checksum += packetContent[i];
    }
    checksum = checksum & 0xFF;
    const calculatedCheck = intToBuffer1(checksum);
    
    if (check[0] !== calculatedCheck[0]) {
        throw new Error(`返回数据包校验和不匹配: 期望 ${calculatedCheck[0].toString(16)}, 实际 ${check[0].toString(16)}`);
    }
    
    // 解析tail (1字节)
    const tail = packet.slice(offset, offset + 1);
    if (tail[0] !== 0x16) {
        throw new Error('返回数据包包尾不正确');
    }
    
    return {
        header,
        header2,
        id,
        fill,
        header3,
        data,
        check,
        tail,
        isValid: true
    };
}

export { generatePacket, generateResponsePacket, parsePacket, parseResponsePacket };

/* // 简单示例

// 发送打包示例
const exampleData = Buffer.from([0x11, 0x18, 0x00, 0x40, 0x1c, 0x46, 0x00, 0x40, 0x1c, 0x46, 0x00, 0x40, 0x1c, 0x46, 0x00, 0x40, 0x1c, 0x46, 0x3c, 0x00, 0x3c, 0x00, 0x3c, 0x00, 0x05, 0x00]);
const packet = generatePacket(801310, exampleData);
console.log("send packet:", packet.toString('hex'));

// 返回打包示例
const responseData = Buffer.from([0x87, 0x10, 0x01, 0x00, 0x00, 0x00, 0x26, 0x47, 0x06, 0x45, 0x2B, 0x87, 0xF3, 0x42, 0x6A, 0x42, 0x86, 0x43]);
const responsePacket = generateResponsePacket(801310, responseData);
console.log("response packet:", responsePacket.toString('hex'));

// 解析示例
try {
    // 解析发送包
    const sendPacketBuffer = Buffer.from('68801310aaaaaa68111800401c4600401c4600401c4600401c463c003c003c000500db16', 'hex');
    const parsedSend = parsePacket(sendPacketBuffer);
    console.log('解析发送包成功:', {
        parsedSend
    });
    
    // 解析返回包
    const responsePacketBuffer = Buffer.from('ffffff68801310aaaaaa68871001000000264706452B87F3426A4286431d16', 'hex');
    const parsedResponse = parseResponsePacket(responsePacketBuffer);
    console.log('解析返回包成功:', {
        parsedResponse
    });
} catch (error) {
    console.error('解析错误:', error.message);
} */