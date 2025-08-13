/**
 * 单字节Buffer转整数
 * @param {Buffer} buffer - 单字节Buffer
 * @returns {number} - 整数值 (0-255)
 */
function bufferToInt1(buffer) {
    // 验证输入
    if (!Buffer.isBuffer(buffer) || buffer.length !== 1) {
        throw new Error('输入必须是单字节Buffer');
    }
    
    return buffer[0];
}

/**
 * 双字节Buffer转整数（大端序）
 * @param {Buffer} buffer - 双字节Buffer
 * @returns {number} - 整数值 (0-65535)
 */
function bufferToInt2(buffer) {
    // 验证输入
    if (!Buffer.isBuffer(buffer) || buffer.length !== 2) {
        throw new Error('输入必须是双字节Buffer');
    }
    
    // 大端序转换
    return (buffer[0] << 8) | buffer[1];
}

/**
 * 整数转单字节Buffer
 * @param {number} intVal - 整数值 (0-255)
 * @returns {Buffer} - 单字节Buffer
 */
function intToBuffer1(intVal) {
    // 验证输入范围
    if (intVal < 0 || intVal > 255 || !Number.isInteger(intVal)) {
        throw new Error('输入必须是0-255之间的整数');
    }
    
    return Buffer.from([intVal]);
}

/**
 * 整数转双字节Buffer（大端序）
 * @param {number} intVal - 整数值 (0-65535)
 * @returns {Buffer} - 双字节Buffer
 */
function intToBuffer2(intVal) {
    // 验证输入范围
    if (intVal < 0 || intVal > 65535 || !Number.isInteger(intVal)) {
        throw new Error('输入必须是0-65535之间的整数');
    }
    
    // 分解为两个字节（大端序）
    const highByte = (intVal >> 8) & 0xFF;
    const lowByte = intVal & 0xFF;
    
    return Buffer.from([highByte, lowByte]);
}

export { bufferToInt1, bufferToInt2, intToBuffer1, intToBuffer2 };

// 示例
/* console.log(bufferToInt1(Buffer.from([0])));     // 输出: 0
console.log(bufferToInt1(Buffer.from([10])));    // 输出: 10
console.log(bufferToInt1(Buffer.from([16])));    // 输出: 16
console.log(bufferToInt1(Buffer.from([255])));   // 输出: 255

console.log(bufferToInt2(Buffer.from([0, 0])));    // 输出: 0
console.log(bufferToInt2(Buffer.from([0, 10])));   // 输出: 10
console.log(bufferToInt2(Buffer.from([0, 255])));  // 输出: 255
console.log(bufferToInt2(Buffer.from([1, 0])));    // 输出: 256
console.log(bufferToInt2(Buffer.from([255, 255]))); // 输出: 65535

console.log(intToBuffer1(0));    // 输出: <Buffer 00>
console.log(intToBuffer1(10));   // 输出: <Buffer 0a>
console.log(intToBuffer1(16));   // 输出: <Buffer 10>
console.log(intToBuffer1(255));  // 输出: <Buffer ff>

console.log(intToBuffer2(0));      // 输出: <Buffer 00 00>
console.log(intToBuffer2(10));     // 输出: <Buffer 00 0a>
console.log(intToBuffer2(255));    // 输出: <Buffer 00 ff>
console.log(intToBuffer2(256));    // 输出: <Buffer 01 00>
console.log(intToBuffer2(65535));  // 输出: <Buffer ff ff> */