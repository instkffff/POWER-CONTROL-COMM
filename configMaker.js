import { createReadStream, writeFileSync, readdirSync } from 'fs';
import { basename, join, extname } from 'path';
import csv from 'csv-parser';

function extractBuildingNumber(filename) {
    const match = filename.match(/No\.(\d+)/);
    return match ? `B${match[1]}` : 'B1';
}

function generateConfigFromCSV(csvFilePath) {
    return new Promise((resolve, reject) => {
        const buildingNumber = extractBuildingNumber(basename(csvFilePath));
        const result = {};
        result[buildingNumber] = {};
        
        let hasGroupColumn = false;

        createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row) => {
                // 检查是否存在组列
                if (!hasGroupColumn && row['组']) {
                    hasGroupColumn = true;
                }
                
                const floor = `F${row['层']}`;
                // 如果有组列则使用组列，否则使用默认规则（G+楼层号）
                const group = row['组'] ? `G${row['组']}` : `G${row['层']}`;
                const roomNumber = row['房间号'];
                const deviceNumber = row['设备号'];

                if (!result[buildingNumber][floor]) {
                    result[buildingNumber][floor] = {};
                }

                if (!result[buildingNumber][floor][group]) {
                    result[buildingNumber][floor][group] = {};
                }

                result[buildingNumber][floor][group][roomNumber] = parseInt(deviceNumber);
            })
            .on('end', () => {
                resolve(result);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// 遍历 ./csv 目录下所有 CSV 文件并分别转换
async function processAllCSVFiles() {
    try {
        const csvDir = './csv';
        const files = readdirSync(csvDir);
        const csvFiles = files.filter(file => extname(file).toLowerCase() === '.csv');
        
        if (csvFiles.length === 0) {
            console.log('在 ./csv 目录下未找到 CSV 文件');
            return;
        }

        for (const csvFile of csvFiles) {
            const csvFilePath = join(csvDir, csvFile);
            console.log(`正在处理: ${csvFile}`);
            
            try {
                const config = await generateConfigFromCSV(csvFilePath);
                // 为每个CSV文件生成对应的JSON文件
                const outputFilePath = join('./', csvFile.replace('.csv', '.json'));
                writeFileSync(outputFilePath, JSON.stringify(config, null, 2));
                console.log(`配置文件已保存至: ${outputFilePath}`);
            } catch (error) {
                console.error(`处理文件 ${csvFile} 时出错:`, error);
            }
        }

        console.log('所有CSV文件已处理完成');
    } catch (error) {
        console.error('处理过程中出错:', error);
    }
}

// 执行转换
processAllCSVFiles();