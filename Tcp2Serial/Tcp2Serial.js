import net from 'net';
import { SerialPort } from 'serialport';

/**
 * TCP转串口转发器（无空闲超时机制版本）
 * @param {Object} options 配置选项
 * @param {string} options.tcpHost TCP服务器地址
 * @param {number} options.tcpPort TCP服务器端口
 * @param {string} options.serialPath 串口路径
 * @param {number} options.serialBaudRate 串口波特率
 * @returns {Object} 包含tcpClient和serialPort的对象
 */
export function createTcp2SerialBridge(options = {}) {
    // 默认配置参数
    const config = {
        tcpHost: '127.0.0.1',
        tcpPort: 2000,
        serialPath: 'COM1',
        serialBaudRate: 9600,
        ...options
    };

    // 连接到TCP服务器
    const tcpClient = new net.Socket();

    // 连接到串口
    const serialPort = new SerialPort({
        path: config.serialPath,
        baudRate: config.serialBaudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
    });

    // 连接到TCP服务器
    tcpClient.connect(config.tcpPort, config.tcpHost, () => {
        console.log(`已连接到TCP服务器 ${config.tcpHost}:${config.tcpPort}`);
    });

    // 处理TCP连接错误
    tcpClient.on('error', (err) => {
        console.error('TCP连接错误:', err.message);
    });

    // 处理TCP连接关闭
    tcpClient.on('close', () => {
        console.log('TCP连接已关闭');
    });

    // 处理TCP数据接收（直接转发）
    tcpClient.on('data', (data) => {
        console.log('收到TCP数据:', data.toString('hex'));
        // 直接转发数据到串口
        serialPort.write(data, (err) => {
            if (err) {
                console.error('写入串口失败:', err.message);
            }
        });
    });

    // 处理串口连接错误
    serialPort.on('error', (err) => {
        console.error('串口错误:', err.message);
    });

    // 处理串口数据接收（直接转发）
    serialPort.on('data', (data) => {
        console.log('收到串口数据:', data.toString('hex'));
        // 直接转发数据到TCP服务器
        tcpClient.write(data, (err) => {
            if (err) {
                console.error('写入TCP失败:', err.message);
            }
        });
    });

    // 处理串口关闭
    serialPort.on('close', () => {
        console.log('串口已关闭');
        // 如果串口关闭，也关闭TCP连接
        tcpClient.destroy();
    });

    // 处理TCP客户端关闭
    tcpClient.on('end', () => {
        console.log('TCP连接结束');
        serialPort.close();
    });

    // 返回实例对象，方便外部控制
    return {
        tcpClient,
        serialPort,
        config
    };
}

// 使用示例:
// const bridge = createTcp2SerialBridge({
//     tcpHost: '192.168.1.100',
//     tcpPort: 3000,
//     serialPath: 'COM3',
//     serialBaudRate: 115200
// });