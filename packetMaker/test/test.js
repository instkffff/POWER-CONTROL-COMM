import { makePacket, parsePacket } from '../main.js'
import { packet } from '../../packet/main.js'
import { writeFileSync } from 'fs'

const id = 801310

// 日志内容存储
let logContent = ''

// 重写console.log以同时输出到控制台和存储到日志内容
const originalLog = console.log
console.log = function(...args) {
    originalLog.apply(console, args)
    logContent += args.join(' ') + '\n'
}

// 基本设置

const basicSetting = {
    totalPower: 1000.0,    // 总功率1000W
    reactivePower: 400.0,  // 阻性功率400W
    activePower: 990.0,    // 上电功率990W
    inductorPower: 990.0,  // 感性功率990W
    delay1: 60,             // 延时1: 60
    delay2: 60,             // 延时2: 60
    delay3: 60,             // 延时3: 60
    retry: 4                // 重试次数: 4
}

const basicSettingFunctionCode = 11

const basicSettingR = {
    hex: '55'
}

const basicSettingFunctionCodeR = 91

// 充电费

const charging = {
    unknown1: 0.0,
    unknown2: 0.0,
    unknown3: 0.0,
    rechargeKWH: 100.0,
    initialKWH: 100.0,  // 初始电量100KWh
    usedKWH: 0.0,      // 使用电量0KWh
    totalKWH: 200.0    // 总电量100KWh
}

const chargingFunctionCode = 12

const chargingR = {
    hex: '55'
}

const chargingFunctionCodeR = 92

// 强制开机
const ForceOpen = {
    hex: "5555"
}

const ForceOpenFunctionCode = 18

const ForceOpenR = {
    hex: "55"
}

const ForceOpenFunctionCodeR = 98

// 强制关机
const ForceHalt = {
    hex: "AAAA"
}

const ForceHaltFunctionCode = 18

const ForceHaltR = {
    hex: "55"
}

const ForceHaltFunctionCodeR = 98

// 恢复正常
const Normal = { 
    hex: "BBBB" 
}

const NormalFunctionCode = 18

const NormalR = {
    hex: "55"
}

const NormalFunctionCodeR = 98

// 读取电量

const ReadKWH = {}

const ReadKWHFunctionCode = 2

const ReadKWHR = {
    unknown1: 0.0,
    unknown2: 0.0,
    unknown3: 0.0,
    rechargeKWH: 0.0,
    initialKWH: 100.0,  // 初始电量100KWh
    usedKWH: 0.0,      // 使用电量0KWh
    totalKWH: 100.0    // 总电量100KWh
}

const ReadKWHFunctionCodeR = 82

// 读取状态

const ReadStatus = {}

const ReadStatusFunctionCode = 7

const ReadStatusR = {
    statusCode: 0,    // 正常开机
    reasonCode: 5,    // 未断电
    voltage: 25.3,    // 实际电压25.3V
    current: 1.3,     // 实际电流1.3A
    power: 12.5       // 实际功率12.5W
}

const ReadStatusFunctionCodeR = 87

// 断电计划

const Schedule = {
    period: 1,
    mode: 1,  // 开关机模式
    power: 0.0,
    weekSchedule: [
        { haltHour: 0, haltMinute: 0, openHour: 7, openMinute: 30 }, // 周一
        { haltHour: 0, haltMinute: 0, openHour: 7, openMinute: 30 }, // 周二
        { haltHour: 0, haltMinute: 0, openHour: 7, openMinute: 30 }, // 周三
        { haltHour: 0, haltMinute: 0, openHour: 7, openMinute: 30 }, // 周四
        { haltHour: 0, haltMinute: 0, openHour: 7, openMinute: 30 }, // 周五
        { haltHour: 0, haltMinute: 0, openHour: 7, openMinute: 30 }, // 周六
        { haltHour: 0, haltMinute: 0, openHour: 7, openMinute: 30 }  // 周日
    ]
}

const ScheduleFunctionCode = 14

const ScheduleR = { 
    hex: '55'
}

const ScheduleFunctionCodeR = 94

// 时间同步

const TimeSync = packet.timeSync.GTD()

const TimeSyncFunctionCode = 15

// 解锁

const Unlock = {
    hex: 'AAAA'
}

const UnlockFunctionCode = 19

const UnlockR = { 
    hex: '55'
}

const UnlockFunctionCodeR = 99

// 窗口设置

const WindowSetting = {
    powerA: 0.0,      // 窗口A功率0W
    powerB: 0.0,      // 窗口B功率0W
    factorA: 100.0,   // 窗口系数A 100.0
    factorB: 100.0    // 窗口系数B 100.0
}

const WindowSettingFunctionCode = 13

const WindowSettingR = { 
    hex: '55'
}

const WindowSettingFunctionCodeR = 93

// 基本设置测试
const basicSettingBuffer = makePacket(id, basicSettingFunctionCode, 'GP', basicSetting)
const basicSettingBufferR = makePacket(id, basicSettingFunctionCodeR, 'GRP', basicSettingR)

const basicSettingBufferP = parsePacket(basicSettingBuffer, 'PP')
const basicSettingBufferRP = parsePacket(basicSettingBufferR, 'PRP')

console.log('基本设置:' + basicSettingBuffer.toString('hex'))
console.log('基本设置解析:' + JSON.stringify(basicSettingBufferP))
console.log('基本设置响应:' + basicSettingBufferR.toString('hex'))
console.log('基本设置响应解析:' + JSON.stringify(basicSettingBufferRP))

// 充电费测试
const chargingBuffer = makePacket(id, chargingFunctionCode, 'GP', charging)
const chargingBufferR = makePacket(id, chargingFunctionCodeR, 'GRP', chargingR)

const chargingBufferP = parsePacket(chargingBuffer, 'PP')
const chargingBufferRP = parsePacket(chargingBufferR, 'PRP')

console.log('充电费:' + chargingBuffer.toString('hex'))
console.log('充电费解析:' + JSON.stringify(chargingBufferP))
console.log('充电费响应:' + chargingBufferR.toString('hex'))
console.log('充电费响应解析:' + JSON.stringify(chargingBufferRP))

// 强制开机测试
const ForceOpenBuffer = makePacket(id, ForceOpenFunctionCode, 'GP', ForceOpen)
const ForceOpenBufferR = makePacket(id, ForceOpenFunctionCodeR, 'GRP', ForceOpenR)

const ForceOpenBufferP = parsePacket(ForceOpenBuffer, 'PP')
const ForceOpenBufferRP = parsePacket(ForceOpenBufferR, 'PRP')

console.log('强制开机:' + ForceOpenBuffer.toString('hex'))
console.log('强制开机解析:' + JSON.stringify(ForceOpenBufferP))
console.log('强制开机响应:' + ForceOpenBufferR.toString('hex'))
console.log('强制开机响应解析:' + JSON.stringify(ForceOpenBufferRP))

// 强制关机测试
const ForceHaltBuffer = makePacket(id, ForceHaltFunctionCode, 'GP', ForceHalt)
const ForceHaltBufferR = makePacket(id, ForceHaltFunctionCodeR, 'GRP', ForceHaltR)

const ForceHaltBufferP = parsePacket(ForceHaltBuffer, 'PP')
const ForceHaltBufferRP = parsePacket(ForceHaltBufferR, 'PRP')

console.log('强制关机:' + ForceHaltBuffer.toString('hex'))
console.log('强制关机解析:' + JSON.stringify(ForceHaltBufferP))
console.log('强制关机响应:' + ForceHaltBufferR.toString('hex'))
console.log('强制关机响应解析:' + JSON.stringify(ForceHaltBufferRP))

// 恢复正常测试
const NormalBuffer = makePacket(id, NormalFunctionCode, 'GP', Normal)
const NormalBufferR = makePacket(id, NormalFunctionCodeR, 'GRP', NormalR)

const NormalBufferP = parsePacket(NormalBuffer, 'PP')
const NormalBufferRP = parsePacket(NormalBufferR, 'PRP')

console.log('恢复正常:' + NormalBuffer.toString('hex'))
console.log('恢复正常解析:' + JSON.stringify(NormalBufferP))
console.log('恢复正常响应:' + NormalBufferR.toString('hex'))
console.log('恢复正常响应解析:' + JSON.stringify(NormalBufferRP))

// 读取电量测试
const ReadKWHBuffer = makePacket(id, ReadKWHFunctionCode, 'GP', ReadKWH)
const ReadKWHBufferR = makePacket(id, ReadKWHFunctionCodeR, 'GRP', ReadKWHR)

const ReadKWHBufferP = parsePacket(ReadKWHBuffer, 'PP')
const ReadKWHBufferRP = parsePacket(ReadKWHBufferR, 'PRP')

console.log('读取电量:' + ReadKWHBuffer.toString('hex'))
console.log('读取电量解析:' + JSON.stringify(ReadKWHBufferP))
console.log('读取电量响应:' + ReadKWHBufferR.toString('hex'))
console.log('读取电量响应解析:' + JSON.stringify(ReadKWHBufferRP))

// 读取状态测试
const ReadStatusBuffer = makePacket(id, ReadStatusFunctionCode, 'GP', ReadStatus)
const ReadStatusBufferR = makePacket(id, ReadStatusFunctionCodeR, 'GRP', ReadStatusR)

const ReadStatusBufferP = parsePacket(ReadStatusBuffer, 'PP')
const ReadStatusBufferRP = parsePacket(ReadStatusBufferR, 'PRP')

console.log('读取状态:' + ReadStatusBuffer.toString('hex'))
console.log('读取状态解析:' + JSON.stringify(ReadStatusBufferP))
console.log('读取状态响应:' + ReadStatusBufferR.toString('hex'))
console.log('读取状态响应解析:' + JSON.stringify(ReadStatusBufferRP))

// 断电计划测试
const ScheduleBuffer = makePacket(id, ScheduleFunctionCode, 'GP', Schedule)
const ScheduleBufferR = makePacket(id, ScheduleFunctionCodeR, 'GRP', ScheduleR)

const ScheduleBufferP = parsePacket(ScheduleBuffer, 'PP')
const ScheduleBufferRP = parsePacket(ScheduleBufferR, 'PRP')

console.log('断电计划:' + ScheduleBuffer.toString('hex'))
console.log('断电计划解析:' + JSON.stringify(ScheduleBufferP))
console.log('断电计划响应:' + ScheduleBufferR.toString('hex'))
console.log('断电计划响应解析:' + JSON.stringify(ScheduleBufferRP))

// 时间同步测试
const TimeSyncBuffer = makePacket(id, TimeSyncFunctionCode, 'GP', TimeSync)

const TimeSyncBufferP = parsePacket(TimeSyncBuffer, 'PP')

console.log('时间同步:' + TimeSyncBuffer.toString('hex'))
console.log('时间同步解析:' + JSON.stringify(TimeSyncBufferP))

// 解锁测试
const UnlockBuffer = makePacket(id, UnlockFunctionCode, 'GP', Unlock)
const UnlockBufferR = makePacket(id, UnlockFunctionCodeR, 'GRP', UnlockR)

const UnlockBufferP = parsePacket(UnlockBuffer, 'PP')
const UnlockBufferRP = parsePacket(UnlockBufferR, 'PRP')

console.log('解锁:' + UnlockBuffer.toString('hex'))
console.log('解锁解析:' + JSON.stringify(UnlockBufferP))
console.log('解锁响应:' + UnlockBufferR.toString('hex'))
console.log('解锁响应解析:' + JSON.stringify(UnlockBufferRP))

// 窗口设置测试
const WindowSettingBuffer = makePacket(id, WindowSettingFunctionCode, 'GP', WindowSetting)
const WindowSettingBufferR = makePacket(id, WindowSettingFunctionCodeR, 'GRP', WindowSettingR)

const WindowSettingBufferP = parsePacket(WindowSettingBuffer, 'PP')
const WindowSettingBufferRP = parsePacket(WindowSettingBufferR, 'PRP')

console.log('窗口设置:' + WindowSettingBuffer.toString('hex'))
console.log('窗口设置解析:' + JSON.stringify(WindowSettingBufferP))
console.log('窗口设置响应:' + WindowSettingBufferR.toString('hex'))
console.log('窗口设置响应解析:' + JSON.stringify(WindowSettingBufferRP))

// 将日志内容写入文件
writeFileSync('test.log', logContent)