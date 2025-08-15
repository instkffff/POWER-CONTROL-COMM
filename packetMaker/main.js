/* 
包生成大函数 

参数: id, functionCode, operation, data

第一步 
调用 func = FCmap(functionCode, operation)
获取函数路径

第二步 
packet = func(functionCode, data)
生成数据包

第三步 
return packet.base.[operation](id, packet)
生成完整数据包

*/

/* 
包解析大函数 

参数: packet, operation

第一步
Data = packet.base.[operation](packet)
解析数据包

第二步
data = Data.data
获取数据 buffer

第三步
采用BCD方法 将data 第一位解析 获取functionCode

第四步
调用 func = FCmap(functionCode, operation)
获取函数路径

第五步
return func.parse.[operation](data)

*/


import { FCmap } from "./functionCodeMapping.js";
import { packet } from "../packet/main.js";

/**
 * 包生成函数
 * @param {number} functionCode - 功能码
 * @param {string} operation - 操作类型 (GP, PP, GRP, PRP)
 * @param {Object} data - 数据对象
 * @returns {Buffer|undefined} 生成的数据包或undefined（如果失败）
 */
function makePacket(id, functionCode, operation, data) {
    // 第一步: 调用 FCmap 获取函数路径
    const func = FCmap(functionCode, operation);
    if (!func) {
        return undefined;
    }

    // 第二步: 生成数据包
    const pkt = func(functionCode, data);

    // 第三步: 生成完整数据包
    if (operation === 'GP') {
        return packet.base.GP(id, pkt);
    } else {
        return packet.base.GRP(id, pkt);
    }

}

/**
 * 包解析函数
 * @param {Buffer} pkt - 接收到的数据包
 * @param {string} operation - 操作类型 (GP, PP, GRP, PRP)
 * @returns {Object|undefined} 解析后的数据或undefined（如果失败）
 */
function parsePacket(pkt, operation) {
    // 第一步: 解析数据包
    const parsedData = packet.base[operation](pkt);

    // 第二步: 获取数据 buffer
    const data = parsedData.data;
    const id = parsedData.id;

    // 第三步: 采用BCD方法将data第一位解析获取functionCode
    // 假设第一位是BCD编码的功能码
    const functionCode = parseInt(data.slice(0, 1).toString('hex'));

    // 第四步: 调用 FCmap 获取函数路径
    const func = FCmap(functionCode, operation);
    if (!func) {
        return undefined;
    }

    // 第五步: 调用解析函数并返回包含id但不包含rawData的结果
    const result = func(data);
    if (result) {
        const { rawData, ...rest } = result;
        return {
            id: id,
            ...rest
        };
    }
    return result;
}

export { makePacket, parsePacket }

/* // 使用示例

// 示例1: 生成basicSetting包
const generatedPacket = makePacket(801310, 11, 'GP', {
    totalPower: 1000.0,    // 总功率1000W
    reactivePower: 400.0,  // 阻性功率400W
    activePower: 990.0,    // 上电功率990W
    inductorPower: 990.0,  // 感性功率990W
    delay1: 60,             // 延时1: 60
    delay2: 60,             // 延时2: 61
    delay3: 60,             // 延时3: 62
    retry: 4                // 重试次数: 4
});

console.log(generatedPacket);

// 示例2: 解析readStatus包
const buffer = Buffer.from('FFFFFF68801310AAAAAA688710010000008E120A457B14F942D5D185433016 ', 'hex');
const parsedData = parsePacket(buffer, 'PRP');
console.log(parsedData);
 */