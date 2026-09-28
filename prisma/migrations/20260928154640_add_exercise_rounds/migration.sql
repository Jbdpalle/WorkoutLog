-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutId" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "targetReps" TEXT,
    "actualReps" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Exercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "WorkoutLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Exercise" ("actualReps", "id", "name", "order", "targetReps", "workoutId") SELECT "actualReps", "id", "name", "order", "targetReps", "workoutId" FROM "Exercise";
DROP TABLE "Exercise";
ALTER TABLE "new_Exercise" RENAME TO "Exercise";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
