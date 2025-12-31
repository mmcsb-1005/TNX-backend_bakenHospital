import prisma from "../../lib/prisma";
import type { Prisma } from "../../../generated/prisma/client";

export const Model = prisma.user;
export type ModelEntity = Prisma.UserGetPayload<{}>;
