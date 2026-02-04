import { prisma } from '../../lib/prisma';
import { stringify } from 'csv-stringify';

const TRAINING_CATEGORY_EXPORT_HEADERS = [
    'Name',
    'Description',
    'Number of Trainings',
];

export const TrainingCategoryExportService = {
    async exportToCsv(): Promise<string> {
        const categoryData = await prisma.trainingCategory.findMany({
            include: {
                trainings: true
            },
            orderBy: { name: 'asc' }
        });

        const records = categoryData.map(category => [
            category.name,
            category.description || '',
            category.trainings.length.toString(),
        ]);

        records.unshift(TRAINING_CATEGORY_EXPORT_HEADERS);

        return new Promise((resolve, reject) => {
            stringify(records, (err, output) => {
                if (err) return reject(err);
                resolve(output);
            });
        });
    },
};
