// schedule.js
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 更新单条 schedule 数据
 * @param {Object} data - 从设备读取的数据
 * {
 *   "id": 801310,
 *   "functionCode": "14",
 *   "length": 35,
 *   "period": 1,             // period ID (1-5)
 *   "mode": 1,               // 要更新到 mode 数组中的值
 *   "power": 0,              // 要更新到 power 数组中的值
 *   "weekSchedule": [...],   // 要更新到 weekSchedule 数组中的值
 *   "isValid": true
 * }
 */
function updateScheduleData(data) {
  try {
    // 创建数据库连接
    const dbPath = join(__dirname, '..', 'power-control.db');
    const db = new Database(dbPath);
    
    // 验证 period 值范围
    if (data.period < 1 || data.period > 5) {
      throw new Error(`period 值必须在 1-5 之间，当前值: ${data.period}`);
    }
    
    // 开始事务以确保数据一致性
    const transaction = db.transaction(() => {
      // 首先获取当前记录的数组数据
      const selectStmt = db.prepare(`
        SELECT period, mode, power, weekSchedule 
        FROM "schedule" 
        WHERE deviceID = ?
      `);
      
      const currentData = selectStmt.get(data.id);
      
      if (!currentData) {
        console.log(`未找到设备 ID ${data.id} 的记录`);
        return { changes: 0 };
      }
      
      // 解析当前的数组数据
      let periodArray = JSON.parse(currentData.period || '[0,0,0,0,0]');
      let modeArray = JSON.parse(currentData.mode || '[0,0,0,0,0]');
      let powerArray = JSON.parse(currentData.power || '[0,0,0,0,0]');
      let weekScheduleArray = JSON.parse(currentData.weekSchedule || '[null,null,null,null,null]');
      
      // 根据 period ID 更新数组中的对应位置 (period 1-5 映射到索引 0-4)
      const periodId = data.period - 1;
      
      // 更新指定位置的值
      periodArray[periodId] = data.period;
      modeArray[periodId] = data.mode;
      powerArray[periodId] = data.power;
      weekScheduleArray[periodId] = data.weekSchedule;
      
      // 准备更新语句
      const updateStmt = db.prepare(`
        UPDATE "schedule" 
        SET period = ?, mode = ?, power = ?, weekSchedule = ?
        WHERE deviceID = ?
      `);
      
      // 将更新后的数组转换为 JSON 字符串
      const periodJson = JSON.stringify(periodArray);
      const modeJson = JSON.stringify(modeArray);
      const powerJson = JSON.stringify(powerArray);
      const weekScheduleJson = JSON.stringify(weekScheduleArray);
      
      // 执行更新
      const result = updateStmt.run(
        periodJson,
        modeJson,
        powerJson,
        weekScheduleJson,
        data.id
      );
      
      return result;
    });
    
    // 执行事务
    const result = transaction();
    
    // 检查是否有记录被更新
    if (result.changes === 0) {
      console.log(`未找到设备 ID ${data.id} 的记录`);
    } else {
      console.log(`成功更新设备 ${data.id} 的调度数据，period: ${data.period}`);
    }
    
    // 关闭数据库连接
    db.close();
    
    return result;
  } catch (error) {
    console.error('更新 schedule 数据失败:', error.message);
    throw error;
  }
}

export { updateScheduleData };

/* // 测试数据 1: 初始化设备调度数据
const testData1 = {
  "id": 801001,
  "functionCode": "14",
  "length": 35,
  "period": 1,  // period ID (数组索引)
  "mode": 1,
  "power": 100.5,
  "weekSchedule": [
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30}
  ],
  "isValid": true
};

// 测试数据 2: 更新同一设备的不同 period
const testData2 = {
  "id": 801001,
  "functionCode": "14",
  "length": 35,
  "period": 2,  // period ID (数组索引)
  "mode": 2,
  "power": 200.75,
  "weekSchedule": [
    {"haltHour":1,"haltMinute":0,"openHour":8,"openMinute":0},
    {"haltHour":1,"haltMinute":0,"openHour":8,"openMinute":0},
    {"haltHour":1,"haltMinute":0,"openHour":8,"openMinute":0},
    {"haltHour":1,"haltMinute":0,"openHour":8,"openMinute":0},
    {"haltHour":1,"haltMinute":0,"openHour":8,"openMinute":0},
    {"haltHour":1,"haltMinute":0,"openHour":8,"openMinute":0},
    {"haltHour":1,"haltMinute":0,"openHour":8,"openMinute":0}
  ],
  "isValid": true
};

// 测试数据 3: 添加第三个 period
const testData3 = {
  "id": 801001,
  "functionCode": "14",
  "length": 35,
  "period": 3,  // period ID (数组索引)
  "mode": 0,
  "power": 50.25,
  "weekSchedule": [
    {"haltHour":2,"haltMinute":30,"openHour":9,"openMinute":15},
    {"haltHour":2,"haltMinute":30,"openHour":9,"openMinute":15},
    {"haltHour":2,"haltMinute":30,"openHour":9,"openMinute":15},
    {"haltHour":2,"haltMinute":30,"openHour":9,"openMinute":15},
    {"haltHour":2,"haltMinute":30,"openHour":9,"openMinute":15},
    {"haltHour":2,"haltMinute":30,"openHour":9,"openMinute":15},
    {"haltHour":2,"haltMinute":30,"openHour":9,"openMinute":15}
  ],
  "isValid": true
};

// 测试数据 4: 测试不存在的设备ID
const testData4 = {
  "id": 999999,  // 不存在的设备ID
  "functionCode": "14",
  "length": 35,
  "period": 1,
  "mode": 1,
  "power": 100,
  "weekSchedule": [],
  "isValid": true
};

console.log('开始测试 schedule 数据更新功能...\n');

try {
  console.log('测试1: 添加设备的第一个 period 数据');
  console.log('----------------------------------------');
  const result1 = updateScheduleData(testData1);
  console.log('更新结果:', result1);
  console.log('\n');
  
  console.log('测试2: 更新同一设备的第二个 period 数据');
  console.log('----------------------------------------');
  const result2 = updateScheduleData(testData2);
  console.log('更新结果:', result2);
  console.log('\n');
  
  console.log('测试3: 添加同一设备的第三个 period 数据');
  console.log('----------------------------------------');
  const result3 = updateScheduleData(testData3);
  console.log('更新结果:', result3);
  console.log('\n');
  
  console.log('测试4: 尝试更新不存在的设备');
  console.log('----------------------------------------');
  const result4 = updateScheduleData(testData4);
  console.log('更新结果:', result4);
  console.log('\n');
  
  console.log('所有测试完成!');
  
} catch (error) {
  console.error('测试过程中发生错误:', error.message);
} */