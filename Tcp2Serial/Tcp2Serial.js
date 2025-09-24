import net from 'net';
import { SerialPort } from 'serialport';

/**
 * TCP转串口转发器（带重连机制版本）
 * @param {Object} options 配置选项
 * @param {string} options.tcpHost TCP服务器地址
 * @param {number} options.tcpPort TCP服务器端口
 * @param {string} options.serialPath 串口路径
 * @param {number} options.serialBaudRate 串口波特率
 * @param {number} options.reconnectInterval 重连间隔（毫秒），默认5000
 * @returns {Object} 包含tcpClient和serialPort的对象
 */
export function createTcp2SerialBridge(options = {}) {
    // 默认配置参数
    const config = {
        tcpHost: '127.0.0.1',
        tcpPort: 2000,
        serialPath: 'COM1',
        serialBaudRate: 9600,
        reconnectInterval: 5000, // 5秒重连间隔
        ...options
    };

    // 连接到串口
    const serialPort = new SerialPort({
        path: config.serialPath,
        baudRate: config.serialBaudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
    });

    let tcpClient = null;
    let reconnectTimer = null;
    let isConnecting = false;

    // 创建并连接TCP客户端
    function connectTcpClient() {
        if (isConnecting) return;
        
        isConnecting = true;
        
        // 清除之前的重连定时器
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }

        // 创建新的TCP客户端
        tcpClient = new net.Socket();

        tcpClient.connect(config.tcpPort, config.tcpHost, () => {
            console.log(`已连接到TCP服务器 ${config.tcpHost}:${config.tcpPort}`);
            isConnecting = false;
        });

        // 处理TCP连接错误
        tcpClient.on('error', (err) => {
            console.error('TCP连接错误:', err.message);
            isConnecting = false;
            scheduleReconnect();
        });

        // 处理TCP连接关闭
        tcpClient.on('close', () => {
            console.log('TCP连接已关闭');
            isConnecting = false;
            scheduleReconnect();
        });

        // 处理TCP数据接收（直接转发）
        tcpClient.on('data', (data) => {
            // console.log('收到TCP数据:', data.toString('hex'));
            // 直接转发数据到串口
            serialPort.write(data, (err) => {
                if (err) {
                    console.error('写入串口失败:', err.message);
                }
            });
        });

        // 处理TCP客户端关闭
        tcpClient.on('end', () => {
            console.log('TCP连接结束');
            serialPort.close();
            isConnecting = false;
            scheduleReconnect();
        });
    }

    // 安排重连
    function scheduleReconnect() {
        if (reconnectTimer) return;
        
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            console.log(`尝试重新连接到TCP服务器 ${config.tcpHost}:${config.tcpPort}...`);
            connectTcpClient();
        }, config.reconnectInterval);
    }

    // 处理串口连接错误
    serialPort.on('error', (err) => {
        console.error('串口错误:', err.message);
    });

    // 处理串口数据接收（直接转发）
    serialPort.on('data', (data) => {
        // console.log('收到串口数据:', data.toString('hex'));
        // 直接转发数据到TCP服务器
        if (tcpClient && tcpClient.readyState === 'open') {
            tcpClient.write(data, (err) => {
                if (err) {
                    console.error('写入TCP失败:', err.message);
                }
            });
        }
    });

    // 处理串口关闭
    serialPort.on('close', () => {
        console.log('串口已关闭');
        // 如果串口关闭，也关闭TCP连接
        if (tcpClient) {
            tcpClient.destroy();
        }
    });

    // 初始化连接
    connectTcpClient();

    // 返回实例对象，方便外部控制
    return {
        tcpClient: () => tcpClient,
        serialPort,
        config,
        // 提供手动重连方法
        reconnect: connectTcpClient,
        // 提供关闭方法
        close: () => {
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
            if (tcpClient) {
                tcpClient.destroy();
            }
            serialPort.close();
        }
    };
}