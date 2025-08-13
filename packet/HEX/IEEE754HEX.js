// 将4字节Buffer转换为单精度浮点数（小端序）
function bufferToFloat(buffer) {
    // 验证输入
    if (!Buffer.isBuffer(buffer) || buffer.length !== 4) {
        throw new Error('输入必须是4字节Buffer');
    }
    
    // 使用小端序读取浮点数
    return buffer.readFloatLE(0);
}

// 将单精度浮点数转换为4字节Buffer（小端序）
function floatToBuffer(floatNum) {
    // 验证输入是否为数字
    if (typeof floatNum !== 'number' || !isFinite(floatNum)) {
        throw new Error('输入必须是有效的数字');
    }
    
    const buffer = Buffer.alloc(4);
    // 使用小端序写入浮点数
    buffer.writeFloatLE(floatNum, 0);
    
    return buffer;
}

export { bufferToFloat, floatToBuffer };

// 示例
/* console.log(bufferToFloat(Buffer.from([0x00, 0x00, 0x80, 0x3f]))); // 输出: 1
console.log(bufferToFloat(Buffer.from([0x00, 0x00, 0x80, 0xbf]))); // 输出: -1

console.log(floatToBuffer(1.0));  // 输出: <Buffer 00 00 80 3f>
console.log(floatToBuffer(-1.0)); // 输出: <Buffer 00 00 80 bf> */