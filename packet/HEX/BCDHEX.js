/**
 * 单字节Buffer转String (BCD转HEX)
 * @param {Buffer} buffer - 输入的BCD格式Buffer（单字节）
 * @returns {string} - 转换后的十六进制字符串
 */
function bcdBufferToHexString(buffer) {
    // 验证输入
    if (!Buffer.isBuffer(buffer) || buffer.length !== 1) {
        throw new Error('输入必须是单字节Buffer');
    }
    
    const byte = buffer[0];
    
    // 验证BCD格式(每个半字节必须是0-9)
    const highNibble = (byte >> 4) & 0xF;
    const lowNibble = byte & 0xF;
    
    if (highNibble > 9 || lowNibble > 9) {
        throw new Error('Invalid BCD byte: ' + byte);
    }
    
    // 转换为十六进制并确保是两位
    return byte.toString(16).padStart(2, '0');
}

/**
 * 单字节String转Buffer (HEX转BCD)
 * @param {string} hexString - 输入的两位十六进制字符串
 * @returns {Buffer} - 转换后的BCD格式Buffer（单字节）
 */
function hexStringToBcdBuffer(hexString) {
    // 验证输入
    if (typeof hexString !== 'string' || hexString.length !== 2) {
        throw new Error('输入必须是两位十六进制字符串');
    }
    
    // 转换为整数
    const byte = parseInt(hexString, 16);
    
    // 验证BCD格式(每个半字节必须是0-9)
    const highNibble = (byte >> 4) & 0xF;
    const lowNibble = byte & 0xF;
    
    if (highNibble > 9 || lowNibble > 9) {
        throw new Error('Invalid BCD byte: ' + hexString);
    }
    
    return Buffer.from([byte]);
}

export { bcdBufferToHexString, hexStringToBcdBuffer };

// 示例
/* console.log(bcdBufferToHexString(Buffer.from([0x12]))); // 输出: "12"
console.log(hexStringToBcdBuffer("12")); // 输出: <Buffer 12>
console.log(bcdBufferToHexString(Buffer.from([0x99]))); // 输出: "99"
console.log(hexStringToBcdBuffer("99")); // 输出: <Buffer 99> */