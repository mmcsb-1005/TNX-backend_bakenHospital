import { createObjectCsvStringifier } from 'csv-writer';

/**
 * Defines the structure for the CSV header, mapping a key in your data object
 * to the display name in the CSV file.
 */
export interface CsvHeader {
  id: string; // The key in the data object (e.g., 'staffName')
  title: string; // The header name in the CSV file (e.g., 'Staff Name')
}

/**
 * Converts an array of JavaScript objects into a CSV string.
 * @param data The array of objects to export.
 * @param header The header configuration (id and title) for the CSV.
 * @returns A promise that resolves to the generated CSV string.
 */
export const exportToCsvString = async <T extends object>(
  data: T[],
  header: CsvHeader[]
): Promise<string> => {
  if (!data || data.length === 0) {
    return '';
  }

  // Create the CSV Stringifier
  const csvStringifier = createObjectCsvStringifier({
    header: header,
    fieldDelimiter: ',',
    headerIdDelimiter: ',',
  });

  // Get the header row string
  const headerString = csvStringifier.getHeaderString();

  // Get the record rows string
  const recordString = csvStringifier.stringifyRecords(data);

  // Combine header and records
  return `${headerString}${recordString}`;
};