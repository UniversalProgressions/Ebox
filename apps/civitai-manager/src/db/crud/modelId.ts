import { prisma } from "../client";
import type { ModelsRequestSort } from "@up/civitai-api/v1";
import { findOrCreateOneCreator } from "./creator";
import { findOrCreateOneModelType } from "./modelType";
import type { ModelsRequestOptions as ModelsRequestOpts, Model } from "@up/civitai-api/v1";
import type { ModelOrderByWithRelationInput, ModelWhereInput } from "../generated/models";
import { DatabaseError } from "../errors";

// export type ModelWithAllRelations = Static<typeof ModelTypeboxSchema>

export async function findOrCreateOneModelId(modelId: Model) {
  try {
    const creatorRecord = modelId.creator
      ? await findOrCreateOneCreator(modelId.creator)
      : undefined;
    const modelTypeRecord = await findOrCreateOneModelType(modelId.type);

    const record = await prisma.model.upsert({
      where: {
        id: modelId.id,
      },
      update: {},
      create: {
        id: modelId.id,
        name: modelId.name,
        creatorId: creatorRecord ? creatorRecord.id : undefined,
        typeId: modelTypeRecord.id,
        nsfw: modelId.nsfw,
        nsfwLevel: modelId.nsfwLevel,
        tags: {
          connectOrCreate: modelId.tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
    });
    return record;
  } catch (error) {
    throw new DatabaseError(
      `Failed to find or create model ID ${modelId.id}`,
      error,
      'model.upsert'
    );
  }
}

function processCursorPaginationFindMany(params: ModelsRequestOpts): ModelWhereInput {
  return {
    name: {
      contains: params.query,
      // mode: 'insensitive', see sql migration "init", added "COLLATE NOCASE" to TEXT Field.
    },
    tags: {
      some: {
        name: { in: params.tag },
      },
    },
    creator: {
      username: params.username,
      // mode: 'insensitive', see sql migration "init", added "COLLATE NOCASE" to TEXT Field.
    },
    type: {
      name: { in: params.types },
    },
    nsfw: params.nsfw,
    modelVersions: {
      some: {
        baseModel: {
          name: { in: params.baseModels },
        },
      },
    },
  }
}

function processSort(sortType?: ModelsRequestSort): ModelOrderByWithRelationInput {
  switch (sortType) {
    case "Newest":
      return {
        id: 'desc'
      }

    default: // defualt as Newest
      return {
        id: 'desc'
      }
  }
}

export async function cursorPaginationQuery(params: ModelsRequestOpts) {
  try {
    const [records, totalCount] = await prisma.$transaction([
      prisma.model.findMany({
        take: 20,
        where: processCursorPaginationFindMany(params),
        include: {
          creator: true,
          modelVersions: true,
          tags: true,
          type: true,
        },
        orderBy: processSort(params.sort)
      }),
      prisma.model.count({
        where: processCursorPaginationFindMany(params),
      }),
    ])

    return { records, totalCount };
  } catch (error) {
    throw new DatabaseError(
      `Failed to execute cursor pagination query`,
      error,
      'model.findMany & count'
    );
  }
}

export async function cursorPaginationNext(params: ModelsRequestOpts, modelIdAsCursor: number) {
  try {
    const records = await prisma.model.findMany({
      cursor: { id: modelIdAsCursor },
      take: 20,
      skip: 1,
      where: processCursorPaginationFindMany(params),
      include: {
        creator: true,
        modelVersions: true,
        tags: true,
        type: true,
      },
      orderBy: processSort(params.sort)
    })
    return records;
  } catch (error) {
    throw new DatabaseError(
      `Failed to execute cursor pagination next for cursor ${modelIdAsCursor}`,
      error,
      'model.findMany'
    );
  }
}

export async function simplePagination(params: ModelsRequestOpts) {
  // defaultPageSize
  if (params.limit === undefined) {
    params.limit = 20;
  }
  if (params.page === undefined || params.page < 1) {
    params.page = 1;
  }

  try {
    const [records, totalCount] = await prisma.$transaction([
      prisma.model.findMany({
        take: params.limit,
        skip: (params.page - 1) * params.limit,
        where: processCursorPaginationFindMany(params),
        include: {
          creator: true,
          modelVersions: true,
          tags: true,
          type: true,
        },
        orderBy: processSort(params.sort)
      }),
      prisma.model.count({
        where: processCursorPaginationFindMany(params),
      }),
    ])

    return { records, totalCount };
  } catch (error) {
    throw new DatabaseError(
      `Failed to execute simple pagination for page ${params.page}`,
      error,
      'model.findMany & count'
    );
  }
}