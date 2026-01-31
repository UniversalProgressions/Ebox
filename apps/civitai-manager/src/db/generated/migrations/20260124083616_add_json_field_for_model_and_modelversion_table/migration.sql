/*
  Warnings:

  - Added the required column `jsonData` to the `Model` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jsonData` to the `ModelVersion` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Model" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "creatorId" INTEGER,
    "typeId" INTEGER NOT NULL,
    "nsfw" BOOLEAN NOT NULL,
    "nsfwLevel" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "jsonData" JSONB NOT NULL,
    CONSTRAINT "Model_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Model_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ModelType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Model" ("createdAt", "creatorId", "id", "name", "nsfw", "nsfwLevel", "typeId", "updatedAt") SELECT "createdAt", "creatorId", "id", "name", "nsfw", "nsfwLevel", "typeId", "updatedAt" FROM "Model";
DROP TABLE "Model";
ALTER TABLE "new_Model" RENAME TO "Model";
CREATE INDEX "Model_name_typeId_creatorId_nsfw_nsfwLevel_idx" ON "Model"("name", "typeId", "creatorId", "nsfw", "nsfwLevel");
CREATE TABLE "new_ModelVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modelId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "baseModelId" INTEGER NOT NULL,
    "baseModelTypeId" INTEGER,
    "publishedAt" DATETIME,
    "nsfwLevel" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "jsonData" JSONB NOT NULL,
    CONSTRAINT "ModelVersion_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModelVersion_baseModelId_fkey" FOREIGN KEY ("baseModelId") REFERENCES "BaseModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ModelVersion_baseModelTypeId_fkey" FOREIGN KEY ("baseModelTypeId") REFERENCES "BaseModelType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ModelVersion" ("baseModelId", "baseModelTypeId", "createdAt", "id", "modelId", "name", "nsfwLevel", "publishedAt", "updatedAt") SELECT "baseModelId", "baseModelTypeId", "createdAt", "id", "modelId", "name", "nsfwLevel", "publishedAt", "updatedAt" FROM "ModelVersion";
DROP TABLE "ModelVersion";
ALTER TABLE "new_ModelVersion" RENAME TO "ModelVersion";
CREATE INDEX "ModelVersion_modelId_name_baseModelId_baseModelTypeId_publishedAt_nsfwLevel_idx" ON "ModelVersion"("modelId", "name", "baseModelId", "baseModelTypeId", "publishedAt", "nsfwLevel");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
