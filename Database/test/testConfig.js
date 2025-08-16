// generateDeviceConfig.js
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置参数
const START_ID = 801000;
const END_ID = 801200;
const FLOORS = 5;
const GROUPS_PER_FLOOR = 4;
const BUILDING_KEY = "B12";

// 计算设备总数和每组基础设备数
const TOTAL_DEVICES = END_ID - START_ID + 1;
const DEVICES_PER_GROUP = Math.floor(TOTAL_DEVICES / (FLOORS * GROUPS_PER_FLOOR));

// 生成设备配置
function generateDeviceConfig() {
    const config = {};
    config[BUILDING_KEY] = {};

    let currentId = START_ID;
    // 记录每层已分配的房间号数量
    const floorRoomCounts = {};
    for (let i = 1; i <= FLOORS; i++) {
        floorRoomCounts[i] = 0;
    }

    // 生成楼层
    for (let floorNum = 1; floorNum <= FLOORS; floorNum++) {
        const floorKey = `F${floorNum}`;
        config[BUILDING_KEY][floorKey] = {};

        // 生成每层的组
        for (let groupNum = 1; groupNum <= GROUPS_PER_FLOOR; groupNum++) {
            const groupKey = `G${groupNum}`;
            config[BUILDING_KEY][floorKey][groupKey] = {};

            // 生成每组的设备
            for (let deviceIndex = 1; deviceIndex <= DEVICES_PER_GROUP && currentId <= END_ID; deviceIndex++) {
                // 房间号格式: 楼层号(1位) + 房间序号(3位)
                // 例如: 1001, 1002, 1003... (楼层1)
                //       2001, 2002, 2003... (楼层2)
                floorRoomCounts[floorNum]++;
                const roomId = `${floorNum}${floorRoomCounts[floorNum].toString().padStart(3, '0')}`;
                config[BUILDING_KEY][floorKey][groupKey][roomId] = currentId;
                currentId++;
            }
        }
    }

    // 处理剩余设备，保持房间号连续
    let floorNum = 1;
    
    while (currentId <= END_ID) {
        const floorKey = `F${floorNum}`;
        
        // 确保楼层存在
        if (!config[BUILDING_KEY][floorKey]) {
            config[BUILDING_KEY][floorKey] = {};
        }
        
        // 确保有足够的组来分配剩余设备
        // 循环使用现有的组或创建新组
        const groupNum = ((floorRoomCounts[floorNum] % GROUPS_PER_FLOOR) || GROUPS_PER_FLOOR);
        const groupKey = `G${groupNum}`;
        
        // 确保组存在
        if (!config[BUILDING_KEY][floorKey][groupKey]) {
            config[BUILDING_KEY][floorKey][groupKey] = {};
        }
        
        // 房间号 (楼层号 + 3位房间序号)，保持连续
        floorRoomCounts[floorNum]++;
        const roomId = `${floorNum}${floorRoomCounts[floorNum].toString().padStart(3, '0')}`;
        
        config[BUILDING_KEY][floorKey][groupKey][roomId] = currentId;
        
        currentId++;
        
        // 移动到下一层（循环）
        floorNum++;
        if (floorNum > FLOORS) {
            floorNum = 1;
        }
    }

    return config;
}

// 保存配置到文件
function saveConfigToFile(config) {
    const outputPath = join(__dirname, 'deviceConfig.json');
    writeFileSync(outputPath, JSON.stringify(config, null, 2));
    console.log(`设备配置已生成并保存到: ${outputPath}`);
    return outputPath;
}

// 执行生成
const deviceConfig = generateDeviceConfig();
const outputPath = saveConfigToFile(deviceConfig);

// 输出统计信息
console.log(`生成了 ${TOTAL_DEVICES} 个设备配置`);
console.log(`每组基础设备数: ${DEVICES_PER_GROUP}`);

// 输出详细统计信息
let totalDevicesGenerated = 0;
for (const [floorKey, floor] of Object.entries(deviceConfig.B12)) {
    console.log(`\n${floorKey}:`);
    let floorRoomStart = null;
    let floorRoomEnd = null;
    
    for (const [groupKey, group] of Object.entries(floor)) {
        const deviceCount = Object.keys(group).length;
        totalDevicesGenerated += deviceCount;
        console.log(`  ${groupKey}: ${deviceCount} 个设备`);
        
        // 显示该组的房间号范围
        const roomIds = Object.keys(group).sort();
        if (roomIds.length > 0) {
            if (!floorRoomStart) floorRoomStart = roomIds[0];
            floorRoomEnd = roomIds[roomIds.length - 1];
        }
    }
    
    if (floorRoomStart && floorRoomEnd) {
        console.log(`  房间号范围: ${floorRoomStart} - ${floorRoomEnd}`);
    }
}
console.log(`\n总共生成设备数: ${totalDevicesGenerated}`);

// 显示一些示例房间号
console.log('\n示例房间号:');
let exampleCount = 0;
for (const [floorKey, floor] of Object.entries(deviceConfig.B12)) {
    if (exampleCount >= 20) break;
    for (const [groupKey, group] of Object.entries(floor)) {
        if (exampleCount >= 20) break;
        const sortedRoomIds = Object.keys(group).sort();
        for (const roomId of sortedRoomIds) {
            if (exampleCount >= 20) break;
            const deviceId = group[roomId];
            console.log(`  房间${roomId} => 设备${deviceId}`);
            exampleCount++;
        }
    }
}