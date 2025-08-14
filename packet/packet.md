# 协议包生成函数文档

## 函数

### 1. base.js

#### generatePacket(id, data)

生成数据包

- 输入:
  - id (number): 设备ID (6位数字)
  - data (Buffer): 数据部分的Buffer
- 输出:
  - (Buffer): 完整的数据包Buffer

#### generateResponsePacket(id, data)

生成返回数据包

- 输入:
  - id (number): 设备ID (6位数字)
  - data (Buffer): 数据部分的Buffer
- 输出:
  - (Buffer): 完整的返回数据包Buffer

#### parsePacket(packet)

解析数据包

- 输入:
  - packet (Buffer): 完整的数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - header (Buffer): 包头
    - id (number): 设备ID
    - fill (Buffer): 填充字段
    - header2 (Buffer): 第二个包头
    - data (Buffer): 数据部分
    - check (Buffer): 校验和
    - tail (Buffer): 包尾
    - isValid (boolean): 数据包是否有效

#### parseResponsePacket(packet)

解析返回数据包

- 输入:
  - packet (Buffer): 完整的返回数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - header (Buffer): 包头
    - header2 (Buffer): 第二个包头
    - id (number): 设备ID
    - fill (Buffer): 填充字段
    - header3 (Buffer): 第三个包头
    - data (Buffer): 数据部分
    - check (Buffer): 校验和
    - tail (Buffer): 包尾
    - isValid (boolean): 数据包是否有效

### 2. baseSetting.js

#### generateBasicSettingPacket(functionCode, settingsData)

生成基本设置命令数据包

- 输入:
  - functionCode (number): 功能码 (默认11)
  - settingsData (Object): 设置数据
    - totalPower (number|Buffer): 总功率 (float / 10)
    - reactivePower (number|Buffer): 阻性功率 (float / 10)
    - activePower (number|Buffer): 上电功率 (float / 10)
    - inductorPower (number|Buffer): 感性功率 (float / 10)
    - delay1 (number|Buffer): 延时1
    - delay2 (number|Buffer): 延时2
    - delay3 (number|Buffer): 延时3
    - retry (number|Buffer): 重试次数
- 输出:
  - (Buffer): 完整的命令数据Buffer

#### parseBasicSettingPacket(packet)

解析基本设置命令数据包

- 输入:
  - packet (Buffer): 命令数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - totalPower (number): 总功率
    - reactivePower (number): 阻性功率
    - activePower (number): 上电功率
    - inductorPower (number): 感性功率
    - delay1 (number): 延时1
    - delay2 (number): 延时2
    - delay3 (number): 延时3
    - retry (number): 重试次数
    - rawData (Object): 原始数据Buffer对象
    - isValid (boolean): 数据包是否有效

#### generateBasicSettingResponse(functionCode, data)

生成基本设置响应数据包

- 输入:
  - functionCode (number): 功能码 (默认91)
  - data (Buffer|Array(number)): 数据部分
- 输出:
  - (Buffer): 完整的响应数据Buffer

#### parseBasicSettingResponse(packet)

解析基本设置响应数据包

- 输入:
  - packet (Buffer): 响应数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - data (Buffer): 数据部分
    - isValid (boolean): 数据包是否有效

### 3. charging.js

#### generateChargingPacket(functionCode, chargingData)

生成充电设置命令数据包

- 输入:
  - functionCode (number): 功能码 (默认12)
  - chargingData (Object): 充电设置数据
    - unknown1 (number|Buffer): 未知用途电量 (KWh = float / 10)
    - unknown2 (number|Buffer): 未知用途电量 (KWh = float / 10)
    - unknown3 (number|Buffer): 未知用途电量 (KWh = float / 10)
    - rechargeKWH (number|Buffer): 充值电量 (KWh = float / 10)
    - initialKWH (number|Buffer): 初始电量 (KWh = float / 10)
    - usedKWH (number|Buffer): 使用电量 (KWh = float / 10)
    - totalKWH (number|Buffer): 总电量 (KWh = float / 10)
- 输出:
  - (Buffer): 完整的命令数据Buffer

#### parseChargingPacket(packet)

解析充电设置命令数据包

- 输入:
  - packet (Buffer): 命令数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - unknown1 (number): 未知用途电量1
    - unknown2 (number): 未知用途电量2
    - unknown3 (number): 未知用途电量3
    - rechargeKWH (number): 充值电量
    - initialKWH (number): 初始电量
    - usedKWH (number): 使用电量
    - totalKWH (number): 总电量
    - rawData (Object): 原始数据Buffer对象
    - isValid (boolean): 数据包是否有效

#### generateChargingResponse(functionCode, data)

生成充电设置响应数据包

- 输入:
  - functionCode (number): 功能码 (默认92)
  - data (Buffer|Array(number)): 数据部分
- 输出:
  - (Buffer): 完整的响应数据Buffer

#### parseChargingResponse(packet)

解析充电设置响应数据包

- 输入:
  - packet (Buffer): 响应数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - data (Buffer): 数据部分
    - isValid (boolean): 数据包是否有效

### 4. readKWH.js

#### generateReadKWHPacket(functionCode)

生成读取电量命令数据包

- 输入:
  - functionCode (number): 功能码 (默认2)
- 输出:
  - (Buffer): 完整的命令数据Buffer

#### parseReadKWHPacket(packet)

解析读取电量命令数据包

- 输入:
  - packet (Buffer): 命令数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - isValid (boolean): 数据包是否有效

#### generateReadKWHResponse(functionCode, kwhData)

生成读取电量响应数据包

- 输入:
  - functionCode (number): 功能码 (默认82)
  - kwhData (Object): 电量数据
    - unknown1 (number|Buffer): 未知用途电量 (KWh = float / 10)
    - unknown2 (number|Buffer): 未知用途电量 (KWh = float / 10)
    - unknown3 (number|Buffer): 未知用途电量 (KWh = float / 10)
    - rechargeKWH (number|Buffer): 充值电量 (KWh = float / 10)
    - initialKWH (number|Buffer): 初始电量 (KWh = float / 10)
    - usedKWH (number|Buffer): 使用电量 (KWh = float / 10)
    - totalKWH (number|Buffer): 总电量 (KWh = float / 10)
- 输出:
  - (Buffer): 完整的响应数据Buffer

#### parseReadKWHResponse(packet)

解析读取电量响应数据包

- 输入:

  - packet (Buffer): 响应数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - unknown1 (number): 未知用途电量1
    - unknown2 (number): 未知用途电量2
    - unknown3 (number): 未知用途电量3
    - rechargeKWH (number): 充值电量
    - initialKWH (number): 初始电量
    - usedKWH (number): 使用电量
    - totalKWH (number): 总电量
    - rawData (Object): 原始数据Buffer对象
    - isValid (boolean): 数据包是否有效

### 5. schedule.js

#### generateSchedulePacket(functionCode, scheduleData)

生成时段设置命令数据包

- 输入:
  - functionCode (number): 功能码 (默认14)
  - scheduleData (Object): 时段设置数据
    - period (number): 时段编号 (1-7)
    - mode (number|Buffer): 时段工作模式 (0=无模式, 1=开关机, 2=小功率)
    - power (number|Buffer): 时段功率 (float / 10, 仅小功率模式生效)
    - weekSchedule (Array(Object)): 一周的时段安排
- 输出:
  - (Buffer): 完整的命令数据Buffer

#### parseSchedulePacket(packet)

解析时段设置命令数据包

- 输入:
  - packet (Buffer): 命令数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - period (number): 时段编号
    - mode (number): 工作模式
    - power (number): 时段功率
    - weekSchedule (Array(Object)): 一周的时段安排
    - rawData (Object): 原始数据Buffer对象
    - isValid (boolean): 数据包是否有效

#### generateScheduleResponse(functionCode, data)

生成时段设置响应数据包

- 输入:
  - functionCode (number): 功能码 (默认94)
  - data (Buffer|Array(number)): 数据部分
- 输出:
  - (Buffer): 完整的响应数据Buffer

#### parseScheduleResponse(packet)

解析时段设置响应数据包

- 输入:
  - packet (Buffer): 响应数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - data (Buffer): 数据部分
    - isValid (boolean): 数据包是否有效

### 6. windowSetting.js

#### generateWindowSettingPacket(functionCode, windowData)

生成窗口设置命令数据包

- 输入:
  - functionCode (number): 功能码 (默认13)
  - windowData (Object): 窗口设置数据
    - powerA (number|Buffer): 窗口A功率 (float / 10)
    - powerB (number|Buffer): 窗口B功率 (float / 10)
    - factorA (number|Buffer): 窗口系数A (float / 1000)
    - factorB (number|Buffer): 窗口系数B (float / 1000)
- 输出:
  - (Buffer): 完整的命令数据Buffer

#### parseWindowSettingPacket(packet)

解析窗口设置命令数据包

- 输入:
  - packet (Buffer): 命令数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - powerA (number): 窗口A功率
    - powerB (number): 窗口B功率
    - factorA (number): 窗口系数A
    - factorB (number): 窗口系数B
    - rawData (Object): 原始数据Buffer对象
    - isValid (boolean): 数据包是否有效

#### generateWindowSettingResponse(functionCode, data)

生成窗口设置响应数据包

- 输入:
  - functionCode (number): 功能码 (默认93)
  - data (Buffer|Array(number)): 数据部分
- 输出:
  - (Buffer): 完整的响应数据Buffer

#### parseWindowSettingResponse(packet)

解析窗口设置响应数据包

- 输入:
  - packet (Buffer): 响应数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - data (Buffer): 数据部分
    - isValid (boolean): 数据包是否有效

### 7. timeSync.js

#### generateTimeSyncPacket(functionCode, timeData)

生成时间同步命令数据包

- 输入:
  - functionCode (number): 功能码 (默认15)
  - timeData (Object): 时间数据
    - second (number): 秒 (0-59)
    - minute (number): 分 (0-59)
    - hour (number): 时 (0-23)
    - day (number): 日 (1-31)
    - month (number): 月 (1-12)
    - week (number): 周 (1-7)
    - year (number): 年 (0-99)
- 输出:
  - (Buffer): 完整的命令数据Buffer

#### parseTimeSyncPacket(packet)

解析时间同步命令数据包

- 输入:
  - packet (Buffer): 命令数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - second (number): 秒
    - minute (number): 分
    - hour (number): 时
    - day (number): 日
    - month (number): 月
    - week (number): 周
    - year (number): 年
    - rawData (Object): 原始数据Buffer对象
    - isValid (boolean): 数据包是否有效

#### getCurrentTimeData()

生成当前时间的同步数据

- 输入:
  - 无
- 输出:
  - (Object): 包含当前时间各个字段的对象
    - second (number): 秒
    - minute (number): 分
    - hour (number): 时
    - day (number): 日
    - month (number): 月
    - week (number): 周
    - year (number): 年

### 8. readStatus.js

#### generateReadStatusPacket(functionCode)

生成读取状态命令数据包

- 输入:
  - functionCode (number): 功能码 (默认7)
- 输出:
  - (Buffer): 完整的命令数据Buffer

#### parseReadStatusPacket(packet)

解析读取状态命令数据包

- 输入:
  - packet (Buffer): 命令数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - isValid (boolean): 数据包是否有效

#### generateReadStatusResponse(functionCode, statusData)

生成读取状态响应数据包

- 输入:
  - functionCode (number): 功能码 (默认87)
  - statusData (Object): 状态数据
    - statusCode (number): 状态码 (0=关机, 1=正常开机, 2=强制开机)
    - reasonCode (number): 原因码 (0=未断电, 4=电量空, 5=时段关机, 6=强制关机, 7=已锁定, 8=未知状态)
    - voltage (number): 电压值 (float / 10)
    - current (number): 电流值 (float / 1000)
    - power (number): 功率值 (float / 10)
- 输出:
  - (Buffer): 完整的响应数据Buffer

#### parseReadStatusResponse(packet)

解析读取状态响应数据包

- 输入:
  - packet (Buffer): 响应数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - statusCode (number): 状态码
    - reasonCode (number): 原因码
    - voltage (number): 电压值
    - current (number): 电流值
    - power (number): 功率值
    - rawData (Object): 原始数据Buffer对象
    - isValid (boolean): 数据包是否有效

### 9. unlock.js

#### generateUnlockPacket(functionCode, data)

生成解锁命令数据包

- 输入:
  - functionCode (number): 功能码 (默认19)
  - data (Buffer|Array(number)): 数据部分
- 输出:
  - (Buffer): 完整的命令数据Buffer

#### parseUnlockPacket(packet)

解析解锁命令数据包

- 输入:
  - packet (Buffer): 命令数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - data (Buffer): 数据部分
    - isValid (boolean): 数据包是否有效

#### generateUnlockResponse(functionCode, data)

生成解锁响应数据包

- 输入:
  - functionCode (number): 功能码 (默认99)
  - data (Buffer|Array(number)): 数据部分
- 输出:
  - (Buffer): 完整的响应数据Buffer

#### parseUnlockResponse(packet)

解析解锁响应数据包

- 输入:
  - packet (Buffer): 响应数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - data (Buffer): 数据部分
    - isValid (boolean): 数据包是否有效

### 10. HaltOpenNormal.js

#### HONgenerateCommandPacket(functionName, functionCode)

生成命令数据包

- 输入:
  - functionName (string): 功能名称 ('forceOpen', 'forceHalt', 'normal')
  - functionCode (number): 功能码 (默认18)
- 输出:
  - (Buffer): 完整的命令数据Buffer

#### HONgenerateResponsePacket(functionName, functionCode)

生成响应数据包

- 输入:
  - functionName (string): 功能名称 ('forceOpen', 'forceHalt', 'normal')
  - functionCode (number): 功能码 (默认98)
- 输出:
  - (Buffer): 完整的响应数据Buffer

#### HONparseCommandPacket(packet)

解析命令数据包

- 输入:
  - packet (Buffer): 命令数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - data (Buffer): 数据部分
    - isValid (boolean): 数据包是否有效

#### HONparseResponsePacket(packet)

解析响应数据包

- 输入:
  - packet (Buffer): 响应数据包Buffer
- 输出:
  - (Object): 解析结果对象
    - functionCode (string): 功能码
    - length (number): 数据长度
    - data (Buffer): 数据部分
    - isValid (boolean): 数据包是否有效
