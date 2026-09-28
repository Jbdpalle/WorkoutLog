-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "waterGoalMl" INTEGER NOT NULL DEFAULT 2500,
    "sleepGoalHrs" REAL NOT NULL DEFAULT 8,
    "programStartDate" DATETIME
);

-- CreateTable
CREATE TABLE "WaterLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountMl" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SleepLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hours" REAL NOT NULL,
    "quality" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WorkoutLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workoutType" TEXT NOT NULL,
    "phaseLabel" TEXT,
    "programDay" INTEGER,
    "rounds" INTEGER NOT NULL DEFAULT 2,
    "durationMin" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetReps" TEXT,
    "actualReps" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Exercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "WorkoutLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
