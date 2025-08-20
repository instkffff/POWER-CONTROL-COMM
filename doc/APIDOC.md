# APIDOC

## login

/api/login

``` json

POST

{
    "number": "15012345678",
    "password": "123456"
}

req

{
    "code":0,
    "name":"张三",
    "token":"hk9cemnlgbut86vgqjtb9"
}


```

## websocket connect

ws://localhost:3001?token=hk9cemnlgbut86vgqjtb9

``` json


req

{
    "type": "connection",
    "status": "success",
    "message": "连接已建立。"
}


```

## websocket API

### 1. command

``` json

{
    "type": "command",
    "requestID": "12345",
    "data": {
        "IDList": [
            801001,
            801002,
            801003,
            801004,
            801005,
            801006,
            801007
        ],
        "FunctionCode": 11,
        "data": {
            "totalPower": 1000.0,
            "reactivePower": 400.0,
            "activePower": 990.0,
            "inductorPower": 990.0,
            "delay1": 60,
            "delay2": 60,
            "delay3": 60,
            "retry": 4
        }
    }
}

req

start

{
    "type": "command",
    "RequestID": "12345",
    "status": "start",
    "message": "任务开始",
    "code": 0
}

progress success

{
    "type":"command",
    "RequestID":"12345",
    "deviceId":801001,
    "status":"success",
    "progress":14,
    "code": 1
}

progress failed

{
    "type":"command",
    "RequestID":"12345",
    "deviceId":801001,
    "status":"failed",
    "progress":14,
    "code": 1
}

mission cancel by new mission

{
    "type":"command",
    "RequestID":"12345",
    "status":"failed",
    "message":"任务被用户取消",
    "code": 2
}

finish

{
    "type": "command",
    "RequestID": "12345",
    "status": "finished",
    "message": "任务完成",
    "successCount": 7,
    "failCount": 0,
    "code": 3
}

COM port error

{
    "type":"command",
    "RequestID":"12345",
    "status":"failed",
    "message":"Opening COM5: File not found",
    "code": 4
}

```

### 2. query

status | basicSetting | readKWHR | schedule | windowSetting

``` json

{
    "type": "status",
    "requestID": "12345",
    "data": {
        "deviceIDList": [
            801001,
            801002,
            801003,
            801004,
            801005,
            801006,
            801007
        ],
        "levelList": [
            1
        ],
        "groupList": [
            1
        ],
        "roomIDList": []
    }
}

req example

{
    "type":"status",
    "requestID":"12345",
    "data":{
        "jsonArray":[
            {
                "deviceID":801001,
                "statusCode":1,
                "reasonCode":0,
                "voltage":217.500048828125,
                "current":0.12236399841308594,
                "activePower":0,
                "power":26.719219970703126,
                "totalKWH":200,
                "roomID":1002,
                "level":1,
                "group":1
            }
        ]
    }
}

{
    "type":"basicSetting",
    "requestID":"12345",
    "data":{
        "jsonArray":[
            {
                "deviceID":801001,
                "totalPower":1000,
                "reactivePower":400,
                "activePower":990,
                "inductorPower":990,
                "delay1":60,
                "delay2":60,
                "delay3":60,
                "retry":4,
                "roomID":1002,
                "level":1,
                "group":1
            }
        ]
    }
}

{
    "type":"schedule",
    "requestID":"12345",
    "data":{
        "jsonArray":[
            {
                "deviceID":801001,
                "period":"[1,2,3,4,5]",
                "mode":"[1,1,0,0,0]",
                "power":"[0,0,50.25,0,0]",
                "weekSchedule":"[[{\"haltHour\":0,\"haltMinute\":0,\"openHour\":7,\"openMinute\":30},{\"haltHour\":0,\"haltMinute\":0,\"openHour\":7,\"openMinute\":30},{\"haltHour\":0,\"haltMinute\":0,\"openHour\":7,\"openMinute\":30},{\"haltHour\":0,\"haltMinute\":0,\"openHour\":7,\"openMinute\":30},{\"haltHour\":0,\"haltMinute\":0,\"openHour\":7,\"openMinute\":30},{\"haltHour\":0,\"haltMinute\":0,\"openHour\":7,\"openMinute\":30},{\"haltHour\":0,\"haltMinute\":0,\"openHour\":7,\"openMinute\":30}],[{\"haltHour\":23,\"haltMinute\":30,\"openHour\":0,\"openMinute\":0},{\"haltHour\":23,\"haltMinute\":30,\"openHour\":0,\"openMinute\":0},{\"haltHour\":23,\"haltMinute\":30,\"openHour\":0,\"openMinute\":0},{\"haltHour\":23,\"haltMinute\":30,\"openHour\":0,\"openMinute\":0},{\"haltHour\":23,\"haltMinute\":30,\"openHour\":0,\"openMinute\":0},{\"haltHour\":23,\"haltMinute\":30,\"openHour\":0,\"openMinute\":0},{\"haltHour\":23,\"haltMinute\":30,\"openHour\":0,\"openMinute\":0}],[{\"haltHour\":2,\"haltMinute\":30,\"openHour\":9,\"openMinute\":15},{\"haltHour\":2,\"haltMinute\":30,\"openHour\":9,\"openMinute\":15},{\"haltHour\":2,\"haltMinute\":30,\"openHour\":9,\"openMinute\":15},{\"haltHour\":2,\"haltMinute\":30,\"openHour\":9,\"openMinute\":15},{\"haltHour\":2,\"haltMinute\":30,\"openHour\":9,\"openMinute\":15},{\"haltHour\":2,\"haltMinute\":30,\"openHour\":9,\"openMinute\":15},{\"haltHour\":2,\"haltMinute\":30,\"openHour\":9,\"openMinute\":15}],[],[]]",
                "roomID":1002,
                "level":1,
                "group":1
            }
        ]
    }
}

{
    "type":"windowSetting",
    "requestID":"12345",
    "data":{
        "jsonArray":[
            {
                "deviceID":801001,
                "powerA":0,
                "powerB":0,
                "factorA":100,
                "factorB":100,
                "roomID":1002,
                "level":1,
                "group":1
            }
        ]
    }
}

{
    "type":"readKWHR",
    "requestID":"12345",
    "data":{
        "jsonArray":[
            {
                "deviceID":801001,
                "rechargeKWH":100,
                "initialKWH":100,
                "usedKWH":0,
                "totalKWH":200,
                "roomID":1002,
                "level":1,
                "group":1
            }
        ]
    }
}

```
