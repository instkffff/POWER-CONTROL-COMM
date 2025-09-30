// status.js
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 更新单条 status 数据
 * @param {Object} data - 从设备读取的数据
 * {
 *   "id": 801310,
 *   "functionCode": "87",
 *   "length": 16,
 *   "statusCode": 0,
 *   "reasonCode": 5,
 *   "voltage": 25.3,
 *   "current": 1.3,
 *   "power": 12.5,
 *   "isValid": true
 * }
 */
function updateStatusData(data) {
  try {
    // 创建数据库连接
    const dbPath = join(__dirname, '..', 'power-control.db');
    const db = new Database(dbPath);

    // 计算有功功率（电压×电流）
    const activePower = data.voltage * data.current;
    
    // 准备更新语句
    const updateStmt = db.prepare(`
      UPDATE "status" 
      SET statusCode = ?, reasonCode = ?, voltage = ?, current = ?, activePower = ?, power = ?
      WHERE deviceID = ?
    `);
    
    // 执行更新
    const result = updateStmt.run(
      data.statusCode,
      data.reasonCode,
      data.voltage,
      data.current,
      activePower,
      data.power,
      data.id
    );
    
    // 检查是否有记录被更新
    if (result.changes === 0) {
      console.log(`未找到设备 ID ${data.id} 的记录`);
    } else {
      console.log(`成功更新设备 ${data.id} 的状态数据`);
    }
    
    // 关闭数据库连接
    db.close();
    
    return result;
  } catch (error) {
    console.error('更新 status 数据失败:', error.message);
    throw error;
  }
}

export { updateStatusData };

/* // 更新单条数据
const data = {
  "id": 801001,
  "functionCode": "87",
  "length": 16,
  "statusCode": 0,
  "reasonCode": 5,
  "voltage": 25.3,
  "current": 1.3,
  "power": 12.5,
  "isValid": true
};

updateStatusData(data); */