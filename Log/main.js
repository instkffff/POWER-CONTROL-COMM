import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { COM, TestMode, testDeviceId, TCPRelay, COMMlog } from '../config.js'

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 将buffer转HEX string 写入 COMM.log
 * 
 * 使用方法 await COMMlog(buffer)
 * 
 * @param {Buffer} buffer - 需要转换并写入日志的buffer数据
 */
async function COMMlog(buffer) {
    try {
        // 将buffer转换为十六进制字符串
        const hexString = buffer.toString('hex').toUpperCase();
        
        // 定义日志文件路径（与当前文件同目录）
        const logFilePath = path.join(__dirname, 'COMM.log');
        
        // 获取当前时间戳
        const timestamp = new Date().toISOString();
        
        // 格式化日志内容
        const logContent = `[${timestamp}] ${hexString}\n`;
        
        if( COMMlog ){
            // 追加写入日志文件
            await fs.appendFile(logFilePath, logContent, 'utf8');
        } else {
            console.log(logContent);
        }

        
    } catch (error) {
        console.error('写入COMM.log时发生错误:', error);
        throw error;
    }
}

export { COMMlog };