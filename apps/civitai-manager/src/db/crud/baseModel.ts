import { prisma } from "../client";

export async function findOrCreateOneBaseModel(baseModelString: string) {
  const record = await prisma.baseModel.upsert({
    where: {
      name: baseModelString,
    },
    update: {},
    create: {
      name: baseModelString,
    },
  });
  return record;
}
