# 前端交互API

## 登录API

/api/login

返回 token 存储在 sessionStorage，用于后续通讯请求。

``` JSON

// success

method: POST

body: {
    "number": "你的电话号",
    "password": "你的密码"
}


return: {
    "code": 0,
    "name": "你的用户名",
    "token": "你的token"
}

// failed

return: {
  "code": 1,
  "message": "电话号或密码错误"
}

```

## websocket连接

使用 token 连接。

## 数据API

采用 websocket 连接

``` JSON

// 发送状态请求

{
    "type": "status", // status | basicSetting | readKWHR | schedule | windowSetting
    "requestID": "请求ID", // 5位随机数
    "data": {
        "deviceIDList": [], // 设备ID列表
        "levelList": [], // 楼层列表
        "groupList": [], // 组列表
        "roomIDList": [] // 房间ID列表
    }
}

// 返回状态

{
    "type": "status", // status | basicSetting | readKWHR | schedule | windowSetting
    "requestID": "请求ID",
    "data": { 
        "jsonArray": []
    }
}

```

## 命令API

采用 websocket 连接

``` JSON

// 发送命令
{
    "type": "command",
    "requestID": "请求ID", // 5位随机数
    "data": {
        "IDList": [
            801310,
            801310,
            801310,
            801310,
            801310,
            801310,
            801310,
            801310
        ], // 设备ID列表
        "FunctionCode": 7, // 命令码
        "data": {} // 命令数据
    }
}

// 响应

{
    "type": "command",
    "requestID": "请求ID",
    "status": "success"
}

// 执行进度返回

{
    "type": "command",
    "requestID": "请求ID",
    "progress": "执行进度" // 百分比 int
}

// 执行错误

{
    "type": "command",
    "requestID": "请求ID",
    "status": "error",
    "deviceID": "设备ID", // 错误设备ID
}

```
