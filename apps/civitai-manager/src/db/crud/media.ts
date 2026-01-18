import { prisma } from "../client";
import type { ModelImage } from "@up/civitai-api/";
import { extractFilenameFromUrl, removeFileExtension } from "../sharedUtils";

export async function createOrConnectImagesByModelIdEndpointInfo(
  modelVersionId: number,
  mediaArray: Array<ModelImage>
) {
  const mediaArrayWithId: Array<ModelImage> = mediaArray.map((image) => {
    const imageFileName = extractFilenameFromUrl(image.url);
    const imageFileNameWithoutExt = removeFileExtension(imageFileName);
    return {
      ...image,
    };
  });
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
}
