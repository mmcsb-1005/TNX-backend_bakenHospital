import { UserRepository } from './User.repository';
import { stringify } from 'csv-stringify';

// Define the required CSV headers
const User_EXPORT_HEADERS = [
    'Full Name',
    'Email',
    'Employee ID',
];

export const UserExportService = {
    /**
     * Fetches User data, maps it to a flat array, and converts it to a CSV string.
     * @returns A Promise resolving to the CSV data string.
     */
    async exportToCsv(): Promise<string> {
        // 1. Fetch raw structured data from the repository
        const UserData = await UserRepository.getAllUserForExport();

        // 2. Map the structured data to a flat, export-friendly array
        const records = UserData.map(User => [
            User.name,
            User.email,
            User.userOrgId,
        ]);

        // 3. Add headers to the beginning of the records array
        records.unshift(User_EXPORT_HEADERS);

        // 4. Convert the array of records into a CSV string
        return new Promise((resolve, reject) => {
            stringify(records, (err, output) => {
                if (err) return reject(err);
                resolve(output);
            });
        });
    },
};
