import { packet } from '../packet/main.js'

/* 
写一个函数 FCmap( functionCode, operation )

把函数都放入一个对象。
输入功能码和操作，返回函数调用路径。

operation 包括

解析 GRP PRP 统一为 R
生成 GP PP 统一为 P

功能码对应列表 

九个模块


// 模块功能码
1. packet.basicSetting
GP PP 11
GRP PRP 91

2. packet.charging
GP PP 12
GRP PRP 92

3. packet.haltOpenNormal
GP PP 18
GRP PRP 98

4. packet.readKWH
GP PP 02
GRP PRP 82

5. packet.readStatus
GP PP 07
GRP PRP 87

6. packet.schedule
GP PP 14
GRP PRP 94

7. packet.timeSync
GP PP 15
本功能没有返回包

8. packet.windowSetting
GP PP 13
GRP PRP 93

9. packet.unlock

GP PP 19
GRP PRP 99
*/

/**
 * 根据功能码和操作类型返回对应的函数调用路径
 * @param {number} functionCode - 功能码
 * @param {string} operation - 操作类型 (GP, PP, GRP, PRP)
 * @returns {Function|undefined} 对应的函数或undefined（如果未找到）
 */
export function FCmap(functionCode, operation) {
  // 功能码到模块的映射
  const functionCodeToModule = {
    // 生成操作 (GP/PP)
    11: 'basicSetting',    // basicSetting
    12: 'charging',        // charging
    18: 'haltOpenNormal',  // haltOpenNormal
    2: 'readKWH',         // readKWH
    7: 'readStatus',      // readStatus
    14: 'schedule',       // schedule
    15: 'timeSync',       // timeSync
    13: 'windowSetting',  // windowSetting
    19: 'unlock',         // unlock

    // 解析操作 (GRP/PRP)
    91: 'basicSetting',    // basicSetting
    92: 'charging',        // charging
    98: 'haltOpenNormal',  // haltOpenNormal
    82: 'readKWH',         // readKWH
    87: 'readStatus',      // readStatus
    94: 'schedule',        // schedule
    93: 'windowSetting',   // windowSetting
    99: 'unlock'           // unlock
  };

  // 操作类型映射
  const operationMap = {
    'GP': 'GP',   // 生成命令包
    'PP': 'PP',   // 生成命令包 (PP统一为GP)
    'GRP': 'GRP', // 生成响应包
    'PRP': 'PRP'  // 生成响应包 (PRP统一为GRP)
  };

  // 获取模块名和操作类型
  const moduleName = functionCodeToModule[functionCode];
  const normalizedOperation = operationMap[operation.toUpperCase()];

  // 如果找不到模块或操作类型无效，返回undefined
  if (!moduleName || !normalizedOperation) {
    return undefined;
  }

  // 特殊处理：timeSync功能没有返回包(GRP)
  if (functionCode === 15 && normalizedOperation === 'GRP') {
    return undefined;
  }

  // 返回对应的函数
  try {
    return packet[moduleName][normalizedOperation];
  } catch (error) {
    return undefined;
  }
}


/* // 调用示例
// 获取basicSetting模块的生成函数
const genFunc = FCmap(11, 'GP'); // 或者 FCmap(11, 'PP')

// 获取readStatus模块的解析函数
const parseFunc = FCmap(87, 'PRP'); // 或者 FCmap(87, 'PRP')

const Packet = genFunc(11, {
  totalPower: 1000.0,    // 总功率10000W
  reactivePower: 400.0,  // 阻性功率4000W
  activePower: 990.0,    // 上电功率9900W
  inductorPower: 990.0,  // 感性功率9900W
  delay1: 60,             // 延时1: 60
  delay2: 60,             // 延时2: 61
  delay3: 60,             // 延时3: 62
  retry: 4                // 重试次数: 4
})

console.log(Packet);

const buffer = Buffer.from('871001000000B7D70A45560EFA4288598543', 'hex')

const fullPacket = packet.base.GP(801310,Packet)

console.log(fullPacket);

const receiveDate = parseFunc(buffer);

console.log(receiveDate); */