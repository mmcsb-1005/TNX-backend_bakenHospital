import type { Prisma } from "../../../generated/prisma/client";
import prisma from "../../lib/prisma";

export const Model = prisma.setting;
export type ModelEntity = Prisma.SettingGetPayload<{}>;