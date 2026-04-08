import { prisma } from '../../lib/prisma';
import { stringify } from 'csv-stringify';

const TRAINING_EXPORT_HEADERS = [
    'Title',
    'Description',
    'Organizer',
    'Training Type',
    'Start Date',
    'End Date',
    'Duration',
    'Venue',
    'Bond Type',
    'Payment Type',
    'Budgeted',
    'Sponsored',
    'Accommodation Cost',
    'Travel Cost',
    'Meal Cost',
    'Training Method',
    'Category',
    'Comment',
    'FAQs',
    'Objectives',
    'Course Curriculum'
];

export const TrainingExportService = {
    async exportToCsv(): Promise<string> {
        const trainingData = await prisma.training.findMany({
            include: {
                category: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const records = trainingData.map(training => [
            training.title,
            training.description || '',
            training.organizer,
            training.trainingType,
            training.dateTimeStart ? new Date(training.dateTimeStart).toISOString() : '',
            training.dateTimeEnd ? new Date(training.dateTimeEnd).toISOString() : '',
            training.duration || '',
            training.venue,
            training.bond,
            training.typeOfPayment,
            training.budgeted ? 'Yes' : 'No',
            training.sponsored || '',
            training.accommodationCost?.toString() || '',
            training.travelCost?.toString() || '',
            training.mealCost?.toString() || '',
            training.trainingMethod,
            training.category?.name || '',
            training.comment || '',
            training.faqs || '',
            training.objectives || '',
            training.courseCurriculum || ''

        ]);

        records.unshift(TRAINING_EXPORT_HEADERS);

        return new Promise((resolve, reject) => {
            stringify(records, (err, output) => {
                if (err) return reject(err);
                resolve(output);
            });
        });
    },
};
