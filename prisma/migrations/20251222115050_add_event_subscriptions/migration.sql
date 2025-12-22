-- CreateTable
CREATE TABLE "EventSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventSubscription_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EventSubscription_userId_idx" ON "EventSubscription"("userId");

-- CreateIndex
CREATE INDEX "EventSubscription_eventId_idx" ON "EventSubscription"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventSubscription_userId_eventId_key" ON "EventSubscription"("userId", "eventId");
