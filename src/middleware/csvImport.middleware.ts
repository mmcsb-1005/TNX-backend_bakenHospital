import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Generic type for CSV row data
type RawImportRow = Record<string, string>

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * Middleware to handle file upload and parse the CSV content into an array of objects.
 * Places the parsed array onto `req.body.data`.
 */
export const csvImportMiddleware = (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, async (err) => {
        // ... (Multer and basic file type error handling - same as before) ...
        if (err || !req.file) {
             return res.status(400).json({ error: 'No file uploaded or file upload failed.' });
        }
        
        const file = req.file;
        const results: RawImportRow[] = [];
        
        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null); 

        try {
            bufferStream
                .pipe(csv())
                .on('data', (data: RawImportRow) => {
                    // ⚠️ Generic Change: Attach the raw parsed row data.
                    // The processor will deal with header names later.
                    results.push(data);
                })
                .on('end', () => {
                    // Attach the parsed data to the request body using a generic key
                    req.body.data = results;
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