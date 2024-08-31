import csv from 'csv-parser';
import { createReadStream } from 'fs';

export const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

export default parseCSV;
