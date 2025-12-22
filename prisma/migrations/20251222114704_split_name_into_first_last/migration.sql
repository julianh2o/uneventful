-- Add new columns as nullable first
ALTER TABLE User ADD COLUMN firstName TEXT;
ALTER TABLE User ADD COLUMN lastName TEXT;

-- Split existing names: take first word as firstName, rest as lastName
-- For single-word names, use the name as firstName and set lastName to empty string
UPDATE User
SET
  firstName = CASE
    WHEN INSTR(name, ' ') > 0 THEN SUBSTR(name, 1, INSTR(name, ' ') - 1)
    ELSE name
  END,
  lastName = CASE
    WHEN INSTR(name, ' ') > 0 THEN LTRIM(SUBSTR(name, INSTR(name, ' ') + 1))
    ELSE ''
  END
WHERE firstName IS NULL;

-- RedefineTables for making columns required and dropping name
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_User" ("id", "firstName", "lastName", "phone", "email", "createdAt", "updatedAt", "deletedAt", "isActive", "isAdmin", "isVerified") SELECT "id", "firstName", "lastName", "phone", "email", "createdAt", "updatedAt", "deletedAt", "isActive", "isAdmin", "isVerified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
