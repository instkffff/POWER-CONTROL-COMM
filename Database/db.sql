CREATE TABLE IF NOT EXISTS "index" (
    "deviceID" INTEGER NOT NULL UNIQUE,
    "roomID" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "group" INTEGER NOT NULL,
    PRIMARY KEY("deviceID")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_index_device_room"
ON "index" ("deviceID", "roomID");

CREATE TABLE IF NOT EXISTS "status" (
    "deviceID" INTEGER NOT NULL UNIQUE,
    "statusCode" INTEGER NOT NULL DEFAULT 0,
    "reasonCode" INTEGER NOT NULL DEFAULT 0,
    "voltage" REAL NOT NULL DEFAULT 0.0,
    "current" REAL NOT NULL DEFAULT 0.0,
    "activePower" REAL NOT NULL DEFAULT 0.0,
    "power" REAL NOT NULL DEFAULT 0.0,
    "totalKWH" REAL NOT NULL DEFAULT 0.0,
    PRIMARY KEY("deviceID"),
    FOREIGN KEY ("deviceID") REFERENCES "index"("deviceID")
    ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS "idx_status_device_status"
ON "status" ("deviceID", "statusCode");

CREATE TABLE IF NOT EXISTS "basicSetting" (
    "deviceID" INTEGER NOT NULL UNIQUE,
    "totalPower" REAL NOT NULL DEFAULT 0.0,
    "reactivePower" REAL NOT NULL DEFAULT 0.0,
    "activePower" REAL NOT NULL DEFAULT 0.0,
    "inductorPower" REAL NOT NULL DEFAULT 0.0,
    "delay1" INTEGER NOT NULL DEFAULT 0,
    "delay2" INTEGER NOT NULL DEFAULT 0,
    "delay3" INTEGER NOT NULL DEFAULT 0,
    "retry" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY("deviceID"),
    FOREIGN KEY ("deviceID") REFERENCES "index"("deviceID")
    ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "windowSetting" (
    "deviceID" INTEGER NOT NULL UNIQUE,
    "powerA" REAL NOT NULL DEFAULT 0.0,
    "powerB" REAL NOT NULL DEFAULT 0.0,
    "factorA" REAL NOT NULL DEFAULT 0.0,
    "factorB" REAL NOT NULL DEFAULT 0.0,
    PRIMARY KEY("deviceID"),
    FOREIGN KEY ("deviceID") REFERENCES "index"("deviceID")
    ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "schedule" (
    "deviceID" INTEGER NOT NULL UNIQUE,
    "period" INTEGER NOT NULL DEFAULT 0,
    "mode" INTEGER NOT NULL DEFAULT 0,
    "power" REAL NOT NULL DEFAULT 0.0,
    "weekSchedule" TEXT NOT NULL,
    PRIMARY KEY("deviceID"),
    FOREIGN KEY ("deviceID") REFERENCES "index"("deviceID")
    ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "ReadKWHR" (
    "deviceID" INTEGER NOT NULL UNIQUE,
    "rechargeKWH" REAL NOT NULL DEFAULT 0.0,
    "initialKWH" REAL NOT NULL DEFAULT 0.0,
    "usedKWH" REAL NOT NULL DEFAULT 0.0,
    "totalKWH" REAL NOT NULL DEFAULT 0.0,
    PRIMARY KEY("deviceID"),
    FOREIGN KEY ("deviceID") REFERENCES "index"("deviceID")
    ON UPDATE NO ACTION ON DELETE NO ACTION
);