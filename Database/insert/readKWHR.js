// readKWHR.js
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 更新单条 ReadKWHR 数据，并同步更新 status 表中的 totalKWH 字段
 * @param {Object} data - 从设备读取的数据
 * {
 *   "id": 801310,
 *   "rechargeKWH": 0,
 *   "initialKWH": 100,
 *   "usedKWH": 0,
 *   "totalKWH": 100
 * }
 */
function updateReadKWHRData(data) {
  try {
    // 创建数据库连接
    const dbPath = join(__dirname, '..', 'test', 'power-control.db');
    const db = new Database(dbPath);
    
    // 准备更新 ReadKWHR 表的语句
    const updateReadKWHRStmt = db.prepare(`
      UPDATE "ReadKWHR" 
      SET rechargeKWH = ?, initialKWH = ?, usedKWH = ?, totalKWH = ?
      WHERE deviceID = ?
    `);
    
    // 准备更新 status 表的语句
    const updateStatusStmt = db.prepare(`
      UPDATE "status" 
      SET totalKWH = ?
      WHERE deviceID = ?
    `);
    
    // 开始事务以确保数据一致性
    const updateTransaction = db.transaction(() => {
      // 执行更新 ReadKWHR 表
      const readKWHRResult = updateReadKWHRStmt.run(
        data.rechargeKWH,
        data.initialKWH,
        data.usedKWH,
        data.totalKWH,
        data.id
      );
      
      // 执行更新 status 表
      const statusResult = updateStatusStmt.run(
        data.totalKWH,
        data.id
      );
      
      return {
        readKWHRChanges: readKWHRResult.changes,
        statusChanges: statusResult.changes
      };
    });
    
    // 执行事务
    const result = updateTransaction();
    
    // 检查是否有记录被更新
    if (result.readKWHRChanges === 0) {
      console.log(`未找到设备 ID ${data.id} 的 ReadKWHR 记录`);
    } else {
      console.log(`成功更新设备 ${data.id} 的电量数据`);
      if (result.statusChanges === 0) {
        console.log(`未找到设备 ID ${data.id} 的 status 记录`);
      } else {
        console.log(`成功同步更新设备 ${data.id} 的状态数据`);
      }
    }
    
    // 关闭数据库连接
    db.close();
    
    return result;
  } catch (error) {
    console.error('更新 ReadKWHR 数据失败:', error.message);
    throw error;
  }
}

export { updateReadKWHRData };

/* // 更新单条数据
const data = {
  "id": 801001,
  "rechargeKWH": 0,
  "initialKWH": 100,
  "usedKWH": 10,
  "totalKWH": 90
};

updateReadKWHRData(data); */