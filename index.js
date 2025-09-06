import { createHttpServer } from './Http/main.js';
import { wss } from './Websocket/main.js';
import { startSerialService } from './Serial/main.js';
import { Cron } from './Crontab/CronMission.js';

// 创建并启动 HTTP 服务器
const server = createHttpServer();
server.listen(3000, () => {
    console.log('Server running on port 3000');
});

// 监听 WebSocket 服务器错误
wss.on('error', (error) => {
    console.error('WebSocket服务器错误:', error);
});

// --- 新增全局错误捕获机制 ---

// 捕获未处理的同步异常（例如：函数中没有try...catch的同步错误）
process.on('uncaughtException', (error) => {
    console.error('捕获到一个未处理的同步异常:');
    console.error(error);
    // ⚠️ 警告: 在生产环境中，通常会记录错误并尝试平稳退出。
    // 在这里我们选择不退出，以保持程序运行。
    // 但这可能会导致程序进入不确定状态，需谨慎使用。
});

// 捕获未处理的 Promise Rejection（例如：async/await 函数中没有catch的错误）
process.on('unhandledRejection', (reason, promise) => {
    console.error('捕获到一个未处理的 Promise Rejection:');
    console.error('原因:', reason);
    console.error('Promise:', promise);
});

// --- 启动服务 ---

// 启动串口服务
startSerialService();

// 启动定时任务
Cron();