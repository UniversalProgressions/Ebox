import { prisma } from "../client";
import type { ModelImage } from "@up/civitai-api/v1";
import {
  extractFilenameFromUrl,
  removeFileExtension,
} from "@up/civitai-api/v1";
import { DatabaseError, ValidationError } from "../errors";

type ModelImageWithId = ModelImage & { id: number };

export async function createOrConnectImagesByModelIdEndpointInfo(
  modelVersionId: number,
  mediaArray: Array<ModelImage>,
): Promise<Array<ModelImageWithId>> {
  // Process images with proper error handling
  const mediaArrayWithId: ModelImageWithId[] = [];
  const validationErrors: ValidationError[] = [];

  for (const image of mediaArray) {
    if (image.id !== null) {
      mediaArrayWithId.push(image as ModelImageWithId);
      continue;
    }

    const filenameResult = extractFilenameFromUrl(image.url);
    if (filenameResult.isErr()) {
      validationErrors.push(
        new ValidationError(
          `Failed to extract filename from image URL: ${image.url}`,
          { 
            url: image.url, 
            error: filenameResult.error.message,
            imageIndex: mediaArray.indexOf(image)
          }
        )
      );
      continue; // Skip invalid images
    }

    const imageFileNameWithoutExt = removeFileExtension(filenameResult.value);
    const id = Number(imageFileNameWithoutExt);
    
    if (isNaN(id)) {
      validationErrors.push(
        new ValidationError(
          `Invalid ID extracted from image URL: ${image.url}`,
          { 
            url: image.url, 
            extractedValue: imageFileNameWithoutExt,
            imageIndex: mediaArray.indexOf(image)
          }
        )
      );
      continue; // Skip invalid images
    }

    mediaArrayWithId.push({
      ...image,
      id,
    } as ModelImageWithId);
  }

  // Log validation errors if any
  if (validationErrors.length > 0) {
    console.warn(
      `Validation errors processing images for model version ${modelVersionId}:`,
      validationErrors.map(err => ({
        message: err.message,
        context: err.context
      }))
    );
  }

  // If no valid images were processed, return empty array
  if (mediaArrayWithId.length === 0) {
    return [];
  }

  try {
    const mvRecord = await prisma.modelVersion.update({
      where: {
        id: modelVersionId,
      },
      data: {
        images: {
          connectOrCreate: mediaArrayWithId.map((image) => ({
            where: { id: image.id },
            create: {
              id: image.id,
              url: image.url,
              nsfwLevel: image.nsfwLevel,
              width: image.width,
              height: image.height,
              hash: image.hash,
              type: image.type,
            },
          })),
        },
      },
      include: {
        images: true,
      },
    });
    return mvRecord.images;
  } catch (error) {
    throw new DatabaseError(
      `Failed to update model version images for model version ${modelVersionId}`,
      error,
      'modelVersion.update'
    );
  }
}
