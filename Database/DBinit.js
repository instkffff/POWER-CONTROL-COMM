// initDatabaseWithData.js
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取数据库初始化SQL
const initSql = readFileSync(join(__dirname, 'db.sql'), 'utf8');

// 读取设备配置
const deviceConfig = JSON.parse(readFileSync(join(__dirname, 'deviceConfig.json'), 'utf8'));

// 初始化数据库并插入数据
function initializeDatabaseWithData() {
  try {
    // 创建数据库连接
    const dbPath = join(__dirname, 'power-control.db');
    const db = new Database(dbPath);
    
    console.log('Connected to the SQLite database.');

    // 执行SQL语句创建表
    db.exec(initSql);
    
    console.log('Database tables created successfully.');
    
    // 准备插入语句
    const insertIndexStmt = db.prepare(`
      INSERT INTO "index" (deviceID, roomID, level, "group") 
      VALUES (?, ?, ?, ?)
    `);
    
    const insertStatusStmt = db.prepare(`
      INSERT INTO "status" (deviceID) 
      VALUES (?)
    `);
    
    const insertBasicSettingStmt = db.prepare(`
      INSERT INTO "basicSetting" (deviceID) 
      VALUES (?)
    `);
    
    const insertWindowSettingStmt = db.prepare(`
      INSERT INTO "windowSetting" (deviceID) 
      VALUES (?)
    `);
    
    const insertScheduleStmt = db.prepare(`
      INSERT INTO "schedule" (deviceID, weekSchedule) 
      VALUES (?, ?)
    `);
    
    const insertReadKWHRStmt = db.prepare(`
      INSERT INTO "ReadKWHR" (deviceID) 
      VALUES (?)
    `);
    
    // 开始事务以提高插入性能
    const insertTransaction = db.transaction((devices) => {
      for (const device of devices) {
        // 插入索引表
        insertIndexStmt.run(device.deviceID, device.roomID, device.level, device.group);
        
        // 插入其他表
        insertStatusStmt.run(device.deviceID);
        insertBasicSettingStmt.run(device.deviceID);
        insertWindowSettingStmt.run(device.deviceID);
        // 为 weekSchedule 提供默认值
        insertScheduleStmt.run(device.deviceID, '[]');
        insertReadKWHRStmt.run(device.deviceID);
      }
    });
    
    // 解析设备配置数据
    const devices = [];
    for (const [buildingKey, building] of Object.entries(deviceConfig)) {
      for (const [floorKey, floor] of Object.entries(building)) {
        // 提取楼层号 (F1 => 1)
        const level = parseInt(floorKey.substring(1));
        
        for (const [groupKey, group] of Object.entries(floor)) {
          // 提取组号 (G1 => 1)
          const groupNum = parseInt(groupKey.substring(1));
          
          for (const [roomID, deviceID] of Object.entries(group)) {
            devices.push({
              deviceID: parseInt(deviceID),
              roomID: parseInt(roomID),
              level: level,
              group: groupNum
            });
          }
        }
      }
    }
    
    // 执行批量插入
    insertTransaction(devices);
    
    console.log(`成功插入 ${devices.length} 条设备记录.`);
    
    // 验证插入的数据
    const count = db.prepare('SELECT COUNT(*) as count FROM "index"').get();
    console.log(`数据库中总共有 ${count.count} 条设备记录.`);
    
    // 关闭数据库连接
    db.close();
    console.log('Database connection closed.');
    
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    throw error;
  }
}

// 执行初始化
initializeDatabaseWithData();