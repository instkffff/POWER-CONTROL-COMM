// QwindowSetting.js
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 使用index表过滤获取windowSetting表数据并补全roomID level group字段
 * @param {Object} filters - 过滤条件
 * @param {Array} filters.deviceIDList - 筛选指定设备ID列表
 * @param {Array} filters.levelList - 筛选指定楼层列表
 * @param {Array} filters.groupList - 筛选指定分组列表
 * @param {Array} filters.roomIDList - 筛选指定房间列表
 * @returns {Array} 查询结果
 */
function queryWindowSettingData(filters = {}) {
  try {
    // 创建数据库连接
    const dbPath = join(__dirname, '..', 'power-control.db');
    const db = new Database(dbPath);
    
    // 构建基础SQL查询 (使用引号包围关键字"group")
    let sql = `
      SELECT 
        ws.deviceID,
        ws.powerA,
        ws.powerB,
        ws.factorA,
        ws.factorB,
        i.roomID,
        i.level,
        i."group"
      FROM windowSetting ws
      JOIN "index" i ON ws.deviceID = i.deviceID
      WHERE 1=1
    `;
    
    // 构建参数数组
    const params = [];
    
    // 添加设备ID筛选条件
    if (filters.deviceIDList && filters.deviceIDList.length > 0) {
      const placeholders = filters.deviceIDList.map(() => '?').join(',');
      sql += ` AND i.deviceID IN (${placeholders})`;
      params.push(...filters.deviceIDList);
    }
    
    // 添加楼层筛选条件
    if (filters.levelList && filters.levelList.length > 0) {
      const placeholders = filters.levelList.map(() => '?').join(',');
      sql += ` AND i.level IN (${placeholders})`;
      params.push(...filters.levelList);
    }
    
    // 添加分组筛选条件
    if (filters.groupList && filters.groupList.length > 0) {
      const placeholders = filters.groupList.map(() => '?').join(',');
      sql += ` AND i."group" IN (${placeholders})`;
      params.push(...filters.groupList);
    }
    
    // 添加房间ID筛选条件
    if (filters.roomIDList && filters.roomIDList.length > 0) {
      const placeholders = filters.roomIDList.map(() => '?').join(',');
      sql += ` AND i.roomID IN (${placeholders})`;
      params.push(...filters.roomIDList);
    }
    
    // 准备并执行查询
    const stmt = db.prepare(sql);
    const result = stmt.all(...params);
    
    // 关闭数据库连接
    db.close();
    
    console.log(`查询到 ${result.length} 条窗口设置数据`);
    
    return result;
  } catch (error) {
    console.error('查询 windowSetting 数据失败:', error.message);
    throw error;
  }
}

export { queryWindowSettingData };

/* // 查询所有窗口设置数据
const allWindowSettings = queryWindowSettingData();

// 按设备ID筛选
const specificDevices = queryWindowSettingData({
  deviceIDList: [801000, 801001, 801002]
});

// 按楼层筛选
const specificLevels = queryWindowSettingData({
  levelList: [1, 2, 3]
});

// 按分组筛选
const specificGroups = queryWindowSettingData({
  groupList: [1, 2]
});

// 按房间ID筛选
const specificRooms = queryWindowSettingData({
  roomIDList: [1001, 1002, 2001]
});

// 组合筛选
const combinedFilters = queryWindowSettingData({
  levelList: [1, 2],
  groupList: [1, 2, 3],
  deviceIDList: [801000, 801001, 801002, 801003]
}); */