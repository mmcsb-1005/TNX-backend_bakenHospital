import { prisma } from '../../lib/prisma';
import { stringify } from 'csv-stringify';

const DESIGNATION_EXPORT_HEADERS = [
    'Name',
    'Description',
    'Level',
    'Parent Designation',
    'Number of Users',
];

export const DesignationExportService = {
    async exportToCsv(): Promise<string> {
        const designationData = await prisma.designation.findMany({
            include: {
                parent: true,
                users: true
            },
            orderBy: { level: 'asc' }
        });

        const records = designationData.map(designation => [
            designation.name,
            designation.description || '',
            designation.level.toString(),
            designation.parent?.name || '',
            designation.users.length.toString(),
        ]);

        records.unshift(DESIGNATION_EXPORT_HEADERS);

        return new Promise((resolve, reject) => {
            stringify(records, (err, output) => {
                if (err) return reject(err);
                resolve(output);
            });
        });
    },
};
