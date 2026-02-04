import { 
    Mail, 
    CreateMailDto, 
    UpdateMailDto, 
    MailRecord 
} from './Mail.model';
// FIX 1: Import the Prisma namespace
import { MailType, SendTrigger, Prisma } from '@prisma/client'; 

// ----------------------------------------------------
// 1. Interface Definition (No Change)
// ----------------------------------------------------
interface MailRepository {
    // ... (omitted interface definitions)
    findById(id: string): Promise<MailRecord | null>;
    findByName(name: string): Promise<MailRecord | null>;
    findByMailType(mailType: MailType): Promise<MailRecord | null>;
    findAll(isActive?: boolean, mailType?: MailType): Promise<MailRecord[]>;
    create(data: CreateMailDto): Promise<MailRecord>;
    update(id: string, data: UpdateMailDto): Promise<MailRecord>;
    delete(id: string): Promise<MailRecord>;
}

// ----------------------------------------------------
// 2. Implementation
// ----------------------------------------------------
class MailRepositoryImpl implements MailRepository {

    async findById(id: string): Promise<MailRecord | null> {
        return await Mail.findUnique({
            where: { id },
        }) as MailRecord | null;
    }

    async findByName(name: string): Promise<MailRecord | null> {
        return await Mail.findUnique({
            where: { name },
        }) as MailRecord | null;
    }

    async findByMailType(mailType: MailType): Promise<MailRecord | null> {
        // Since mailType is unique in the schema (implicitly, as it's a unique template), 
        // findUnique is the appropriate choice.
        return await Mail.findUnique({
            where: { mailType },
        }) as MailRecord | null;
    }

    async findAll(isActive?: boolean, mailType?: MailType): Promise<MailRecord[]> {
        const where: any = {};
        
        if (typeof isActive === 'boolean') {
            where.isActive = isActive;
        }

        if (mailType) {
            where.mailType = mailType;
        }

        return await Mail.findMany({
            where,
            orderBy: { name: 'asc' }, 
        }) as MailRecord[];
    }

    async create(data: CreateMailDto): Promise<MailRecord> {
        const createData: any = {
            ...data,
            // Ensure daysOffset is null if not provided
            daysOffset: data.daysOffset === undefined ? null : data.daysOffset,
        };

        // FIX 2: Handle null for Json type (templateVariables)
        if (createData.templateVariables === null) {
            createData.templateVariables = Prisma.DbNull;
        }

        return await Mail.create({
            data: createData,
        }) as MailRecord;
    }

    async update(id: string, data: UpdateMailDto): Promise<MailRecord> {
        const updateData: any = {
            ...data,
            // Ensure daysOffset can be explicitly set to null
            daysOffset: data.daysOffset === undefined ? undefined : data.daysOffset,
        };

        // FIX 2: Handle null for Json type (templateVariables)
        if (updateData.templateVariables === null) {
            updateData.templateVariables = Prisma.DbNull;
        }
        
        return await Mail.update({
            where: { id },
            data: updateData,
        }) as MailRecord;
    }

    async delete(id: string): Promise<MailRecord> {
        return await Mail.delete({
            where: { id },
        }) as MailRecord;
    }
}

export const MailRepository = new MailRepositoryImpl();