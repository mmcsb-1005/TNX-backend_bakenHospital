import type { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";

export const Model = prisma.setting;
export type ModelEntity = Prisma.SettingGetPayload<{}>;