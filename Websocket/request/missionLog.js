import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const missionListPath = join(__dirname, '../../', 'missionList.json');

async function addMission(requestData) { 
  // 将请求数据以数组元素的形式追加写入 missionList.json 文件
  const fileExists = await import('fs/promises').then(fs => fs.access(missionListPath).then(() => true).catch(() => false));
  
  if (!fileExists) {
    // 如果文件不存在，创建文件并写入包含新数据的数组
    await writeFile(missionListPath, JSON.stringify([requestData], null, 2));
  } else {
    // 如果文件存在，读取现有内容并追加数据
    const fs = await import('fs/promises');
    const currentContent = await fs.readFile(missionListPath, 'utf8');
    
    let missionList = [];
    try {
      missionList = JSON.parse(currentContent);
    } catch (error) {
      // 如果解析失败，从空数组开始
      missionList = [];
    }
    
    missionList.push(requestData);
    await fs.writeFile(missionListPath, JSON.stringify(missionList, null, 2));
  }
}

export { addMission }