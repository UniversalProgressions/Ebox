import { prisma } from "../client";
import { modelSchema, modelVersionSchema } from "@up/civitai-api/v1/models/models";
import { getSettings } from "../../modules/settings";
import { findOrCreateOneBaseModel } from "./baseModel";
import { findOrCreateOneBaseModelType } from "./baseModelType";
import { findOrCreateOneModelId } from "./modelId";
import { normalize, sep } from "node:path";
import { scanModels } from "../utils";
import {
  getModelIdApiInfoJsonPath,
  getModelVersionApiInfoJsonPath,
} from "../../modules/civitai/file-layout";
import type { ModelTypes, Model, ModelVersionAny } from "@up/civitai-api/v1";
import { type } from "arktype";
import { DatabaseError, ValidationError } from "../errors";

export async function upsertOneModelVersion(
  modelId: Model,
  modelVersion: ModelVersionAny
) {
  try {
    const baseModelRecord = await findOrCreateOneBaseModel(
      modelVersion.baseModel
    );
    const baseModelTypeRecord = modelVersion.baseModelType
      ? await findOrCreateOneBaseModelType(
        modelVersion.baseModelType,
        baseModelRecord.id
      )
      : undefined;
    const modelIdRecord = await findOrCreateOneModelId(modelId);

    const record = await prisma.modelVersion.upsert({
      where: {
        id: modelVersion.id,
      },
      update: {
        name: modelVersion.name,
        baseModelId: baseModelRecord.id,
        baseModelTypeId: baseModelTypeRecord ? baseModelTypeRecord.id : undefined,
        publishedAt: modelVersion.publishedAt ?? undefined,
        nsfwLevel: modelVersion.nsfwLevel,
      },
      create: {
        id: modelVersion.id,
        modelId: modelIdRecord.id,
        name: modelVersion.name,
        baseModelId: baseModelRecord.id,
        baseModelTypeId: baseModelTypeRecord ? baseModelTypeRecord.id : undefined,
        publishedAt: modelVersion.publishedAt ?? undefined,
        nsfwLevel: modelVersion.nsfwLevel,
        images: {
          connectOrCreate: modelVersion.images
            .filter((image) => image.id !== null)
            .map((image) => ({
              where: { id: image.id! },
              create: {
                id: image.id!,
                url: image.url,
                nsfwLevel: image.nsfwLevel,
                width: image.width,
                height: image.height,
                hash: image.hash,
                type: image.type,
              },
            })),
        },
        files: {
          connectOrCreate: modelVersion.files.map((file) => ({
            where: { id: file.id },
            create: {
              id: file.id,
              sizeKB: file.sizeKB,
              name: file.name,
              type: file.type,
              downloadUrl: file.downloadUrl,
            },
          })),
        },
      },
    });

    return record;
  } catch (error) {
    throw new DatabaseError(
      `Failed to upsert model version ${modelVersion.id} for model ${modelId.id}`,
      error,
      'modelVersion.upsert'
    );
  }
}

export async function deleteOneModelVersion(
  modelVersionId: number,
  modelId: number
) {
  try {
    await prisma.modelVersion.delete({
      where: {
        id: modelVersionId,
      },
    });
    
    // Check if there is any modelVersion have same modelId
    const remainingModelVersions = await prisma.modelVersion.count({
      where: { modelId: modelId },
    });

    // delete modelId if it has no modelversion records in database
    if (remainingModelVersions === 0) {
      await prisma.model.delete({
        where: {
          id: modelId,
        },
      });
    }
  } catch (error) {
    throw new DatabaseError(
      `Failed to delete model version ${modelVersionId} for model ${modelId}`,
      error,
      'modelVersion.delete & model.delete'
    );
  }
}

type ModelInfo = {
  modelType: string;
  modelId: number;
  versionId: number;
  filePath: string;
  fileName: string;
};

/**
 * 从.safetensors文件路径中提取模型信息（支持批量处理）
 * @param filePaths 文件路径数组
 * @returns 包含模型信息的数组，无效路径会被过滤
 */
export function extractAllModelInfo(filePaths: string[]): ModelInfo[] {
  return filePaths
    .map((filePath) => {
      const normalizedPath = normalize(filePath);
      const parts = normalizedPath.split(sep);

      if (parts.length < 3) return null;

      const fileName = parts[parts.length - 1];
      if (!fileName || !fileName.endsWith(".safetensors")) return null;

      return {
        modelType: parts[parts.length - 4] || "unknown",
        modelId: Number(parts[parts.length - 3]),
        versionId: Number(parts[parts.length - 2]),
        filePath: normalizedPath,
        fileName: fileName.replace(".safetensors", ""),
      };
    })
    .filter((info): info is ModelInfo => info !== null);
}

export async function scanModelsAndSyncToDb() {
  try {
    const safetensorsPaths = await scanModels();
    const safetensors = extractAllModelInfo(safetensorsPaths);
    
    for (let index = 0; index < safetensors.length; index++) {
      const modelInfo = safetensors[index];
      if (!modelInfo) continue;
      
      const isExistsInDb = await prisma.modelVersion.findUnique({
        where: {
          id: modelInfo.versionId,
        },
      });
      
      if (isExistsInDb === null) {
        const modelVersionJson = Bun.file(getModelVersionApiInfoJsonPath(
          getSettings().basePath,
          modelInfo.modelType as ModelTypes,
          modelInfo.modelId,
          modelInfo.versionId
        ));
        
        if ((await modelVersionJson.exists()) === false) {
          console.warn(
            `Model version ${modelInfo.versionId}'s JSON file doesn't exist, exclude from processing.`
          );
          continue;
        }
        
        const modelVersionData = await modelVersionJson.json();
        const modelVersionInfo = modelVersionSchema(modelVersionData);
        
        if (modelVersionInfo instanceof type.errors) {
          console.error(
            `Validation error for model version ${modelInfo.versionId}:`,
            modelVersionInfo.summary
          );
          throw new ValidationError(
            `Invalid model version data for version ${modelInfo.versionId}`,
            { 
              versionId: modelInfo.versionId,
              validationErrors: modelVersionInfo.summary 
            }
          );
        }
        
        const modelIdJson = Bun.file(getModelIdApiInfoJsonPath(
          getSettings().basePath,
          modelInfo.modelType as ModelTypes,
          modelInfo.modelId
        ));
        
        if ((await modelIdJson.exists()) === false) {
          console.warn(
            `Model ID ${modelInfo.modelId}'s JSON file doesn't exist, exclude from processing.`
          );
          continue;
        }
        
        const modelIdData = await modelIdJson.json();
        const modelIdInfo = modelSchema(modelIdData);
        
        if (modelIdInfo instanceof type.errors) {
          console.error(
            `Validation error for model ID ${modelInfo.modelId}:`,
            modelIdInfo.summary
          );
          throw new ValidationError(
            `Invalid model data for model ${modelInfo.modelId}`,
            { 
              modelId: modelInfo.modelId,
              validationErrors: modelIdInfo.summary 
            }
          );
        }
        
        // Add modelId to modelVersionInfo since upsertOneModelVersion expects it
        const modelVersionWithModelId = {
          ...modelVersionInfo,
          modelId: modelIdInfo.id,
          publishedAt: modelVersionInfo.publishedAt ?? undefined
        };
        await upsertOneModelVersion(modelIdInfo, modelVersionWithModelId);
      }
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Failed to scan models and sync to database`,
      error,
      'scanModelsAndSyncToDb'
    );
  }
}
