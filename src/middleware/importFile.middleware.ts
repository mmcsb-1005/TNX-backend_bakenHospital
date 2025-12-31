import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { UserImportRow } from '../modules/user/UserImport.model'; 
import { Readable } from 'stream';

// 1. Setup Multer Storage (Use memory storage for processing stream data)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * Middleware to handle file upload and parse the CSV content into an array of objects.
 * It places the parsed array onto `req.body.staffData`.
 */
export const csvImportMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // 1. Multer handles the file upload
    upload.single('file')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(500).json({ error: 'File upload error: ' + err.message });
        } else if (err) {
            // An unknown error occurred.
            return res.status(500).json({ error: 'Unknown file error: ' + (err as Error).message });
        }

        // 2. Check for uploaded file
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded. Please upload a CSV file with field name "file".' });
        }
        
        const file = req.file;

        // Ensure it's a CSV (optional but recommended)
        if (file.mimetype !== 'text/csv' && file.mimetype !== 'application/vnd.ms-excel') {
             return res.status(400).json({ error: `Invalid file type: ${file.mimetype}. Only CSV is supported.` });
        }

        const results: UserImportRow[] = [];
        
        // 3. Create a stream from the buffer
        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null); // End the stream

        // 4. Pipe the stream through the CSV parser
        try {
            bufferStream
                .pipe(csv())
                .on('data', (data) => {
                    // Map CSV columns (keys are the column headers) to your UserImportRow interface
                    const staffName = data.name 
                      || data['Name'] // For common capitalization issues
                      || Object.values(data)[0];
                    results.push({
                        name: (staffName && typeof staffName === 'string') ? staffName.trim() : null,
                        email: data.email,
                        gender: data.gender,
                        positionName: data['Position Name'], // Use exact header name from file
                        unitName: data['Unit Name'],         // Use exact header name from file
                        supervisorEmail: data['Supervisor Email'],
                        staffOrgId: data['Staff Org ID'],
                        password: data.password,
                    } as UserImportRow);
                })
                .on('end', () => {
                    // Attach the parsed data to the request body
                    // This data is what the controller will access.
                    req.body.staffData = results;
                    next();
                })
                .on('error', (parseError) => {
                    return res.status(500).json({ error: 'Failed to parse CSV file: ' + parseError.message });
                });

        } catch (parseError) {
            return res.status(500).json({ error: 'Error during CSV parsing setup.' });
        }
    });
};
