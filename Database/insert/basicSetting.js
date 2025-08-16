// basicSetting.js
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 更新单条 basicSetting 数据
 * @param {Object} data - 从设备读取的数据
 * {
 *   "id": 801310,
 *   "functionCode": "11",
 *   "length": 24,
 *   "totalPower": 1000,
 *   "reactivePower": 400,
 *   "activePower": 990,
 *   "inductorPower": 990,
 *   "delay1": 60,
 *   "delay2": 60,
 *   "delay3": 60,
 *   "retry": 4,
 *   "isValid": true
 * }
 */
function updateBasicSettingData(data) {
  try {
    // 创建数据库连接
    const dbPath = join(__dirname, '..', 'power-control.db');
    const db = new Database(dbPath);
    
    // 准备更新语句
    const updateStmt = db.prepare(`
      UPDATE "basicSetting" 
      SET totalPower = ?, reactivePower = ?, activePower = ?, inductorPower = ?, 
          delay1 = ?, delay2 = ?, delay3 = ?, retry = ?
      WHERE deviceID = ?
    `);
    
    // 执行更新
    const result = updateStmt.run(
      data.totalPower,
      data.reactivePower,
      data.activePower,
      data.inductorPower,
      data.delay1,
      data.delay2,
      data.delay3,
      data.retry,
      data.id
    );
    
    // 检查是否有记录被更新
    if (result.changes === 0) {
      console.log(`未找到设备 ID ${data.id} 的记录`);
    } else {
      console.log(`成功更新设备 ${data.id} 的基本设置数据`);
    }
    
    // 关闭数据库连接
    db.close();
    
    return result;
  } catch (error) {
    console.error('更新 basicSetting 数据失败:', error.message);
    throw error;
  }
}

export { updateBasicSettingData };

/* // 更新单条数据
const data = {
  "id": 801001,
  "functionCode": "11",
  "length": 24,
  "totalPower": 1000,
  "reactivePower": 400,
  "activePower": 990,
  "inductorPower": 990,
  "delay1": 60,
  "delay2": 60,
  "delay3": 60,
  "retry": 4,
  "isValid": true
};

updateBasicSettingData(data); */