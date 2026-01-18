import { PrismaClient } from "./generated/client";
import { PrismaBunSqlite } from "prisma-adapter-bun-sqlite";

const adapter = new PrismaBunSqlite({ url: "file:./db.sqlite" });
export const prisma = new PrismaClient({ adapter });

// const users = await prisma.user.findMany();