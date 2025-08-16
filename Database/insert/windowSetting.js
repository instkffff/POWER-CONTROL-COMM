// windowSetting.js
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 更新单条 windowSetting 数据
 * @param {Object} data - 从设备读取的数据
 * {
 *   "id": 801310,
 *   "functionCode": "13",
 *   "length": 16,
 *   "powerA": 0,
 *   "powerB": 0,
 *   "factorA": 100,
 *   "factorB": 100,
 *   "isValid": true
 * }
 */
function updateWindowSettingData(data) {
  try {
    // 创建数据库连接
    const dbPath = join(__dirname, '..', 'test', 'power-control.db');
    const db = new Database(dbPath);
    
    // 准备更新语句
    const updateStmt = db.prepare(`
      UPDATE "windowSetting" 
      SET powerA = ?, powerB = ?, factorA = ?, factorB = ?
      WHERE deviceID = ?
    `);
    
    // 执行更新
    const result = updateStmt.run(
      data.powerA,
      data.powerB,
      data.factorA,
      data.factorB,
      data.id
    );
    
    // 检查是否有记录被更新
    if (result.changes === 0) {
      console.log(`未找到设备 ID ${data.id} 的记录`);
    } else {
      console.log(`成功更新设备 ${data.id} 的窗口设置数据`);
    }
    
    // 关闭数据库连接
    db.close();
    
    return result;
  } catch (error) {
    console.error('更新 windowSetting 数据失败:', error.message);
    throw error;
  }
}

export { updateWindowSettingData };

/* // 更新单条数据
const data = {
  "id": 801001,
  "functionCode": "13",
  "length": 16,
  "powerA": 0,
  "powerB": 0,
  "factorA": 100,
  "factorB": 100,
  "isValid": true
};

updateWindowSettingData(data); */