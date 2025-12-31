import { Model } from "./Setting.model";

interface DataRepository {
  getAllData(): Promise<any[]>;
  getDataById(id: String): Promise<any>;
  createData(data: any): Promise<any>;
  updateData(id: String, data: any): Promise<any>;
  deleteData(id: String): Promise<void>;
}

class DataRepositoryImpl implements DataRepository {
  async getAllData(): Promise<any[]> {
    return await Model.findMany();
  }

  async getDataById(id: string): Promise<any> {
    return await Model.findUnique({ where: { id } });
  }

  async createData(data: any): Promise<any> {
    return await Model.create({ data });
  }

  async updateData(id: string, data: any): Promise<any> {
    return await Model.update({ where: { id }, data });
  }

  async deleteData(id: string): Promise<void> {
    await Model.delete({ where: { id } });
  }

  async getLogoPath(): Promise<string | null> {
    const setting = await Model.findFirst({
      select: {
        logoPath: true
      },
    });
    return setting?.logoPath ?? null;
  }
}

export const DataRepository = new DataRepositoryImpl();