import Papa from 'papaparse';
import fs from 'fs';
import { Readable } from 'stream';

export interface ParsedCSVData {
  headers: string[];
  rows: any[][];
  totalRows: number;
  sampleData: any[];
}

export class CSVParserService {
  /**
   * Parse CSV file from file path
   */
  static async parseCSVFile(filePath: string, sampleSize: number = 1000): Promise<ParsedCSVData> {
    return new Promise((resolve, reject) => {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          try {
            const headers = results.meta.fields || [];
            const rows = results.data as any[];
            const totalRows = rows.length;
            
            // Get sample data for analysis
            const sampleData = rows.slice(0, Math.min(sampleSize, totalRows));
            
            resolve({
              headers,
              rows: rows.map(row => headers.map(header => row[header])),
              totalRows,
              sampleData
            });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * Parse CSV from buffer
   */
  static async parseCSVBuffer(buffer: Buffer, sampleSize: number = 1000): Promise<ParsedCSVData> {
    return new Promise((resolve, reject) => {
      const content = buffer.toString('utf8');
      
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          try {
            const headers = results.meta.fields || [];
            const rows = results.data as any[];
            const totalRows = rows.length;
            
            const sampleData = rows.slice(0, Math.min(sampleSize, totalRows));
            
            resolve({
              headers,
              rows: rows.map(row => headers.map(header => row[header])),
              totalRows,
              sampleData
            });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * Get column data types
   */
  static detectDataTypes(data: any[], headers: string[]): Record<string, string> {
    const types: Record<string, string> = {};
    
    headers.forEach(header => {
      const values = data.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '');
      
      if (values.length === 0) {
        types[header] = 'unknown';
        return;
      }

      // Check if all values are numbers
      const numericValues = values.filter(val => !isNaN(Number(val)) && isFinite(Number(val)));
      if (numericValues.length === values.length) {
        // Check if all are integers
        const integerValues = numericValues.filter(val => Number.isInteger(Number(val)));
        types[header] = integerValues.length === numericValues.length ? 'integer' : 'float';
        return;
      }

      // Check if all values are booleans
      const booleanValues = values.filter(val => 
        typeof val === 'boolean' || 
        (typeof val === 'string' && ['true', 'false', 'yes', 'no', '1', '0'].includes(val.toLowerCase()))
      );
      if (booleanValues.length === values.length) {
        types[header] = 'boolean';
        return;
      }

      // Check if all values are dates
      const dateValues = values.filter(val => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      });
      if (dateValues.length === values.length) {
        types[header] = 'date';
        return;
      }

      // Default to string
      types[header] = 'string';
    });

    return types;
  }
}