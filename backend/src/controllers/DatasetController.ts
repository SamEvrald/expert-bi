import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import csv from 'csv-parser';
import { createReadStream } from 'fs';
import Database from '../config/database';
import { DataTypeHandler } from '../services/DataTypeHandler';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
  file?: Express.Multer.File;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: async (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void
    ) => {
      const uploadDir = path.join(__dirname, '../../uploads');
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        cb(error as Error, uploadDir);
      }
    },
    filename: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void
    ) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

export class DatasetController {
  static uploadMiddleware = upload.single('file');

  /**
   * Upload and process dataset
   */
  static async uploadDataset(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const file = req.file;
      const { name, description } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!name) {
        return res.status(400).json({ error: 'Dataset name is required' });
      }

      const filePath = file.path;
      const fileName = file.filename;

      // Parse CSV to get column info
      const columns = await DatasetController.parseCSVColumns(filePath);
      const rowCount = await DatasetController.countCSVRows(filePath);

      // Insert dataset record
      const result = await Database.query(
        `INSERT INTO datasets 
         (user_id, name, description, file_name, file_path, file_size, row_count, column_count, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          name,
          description || null,
          fileName,
          filePath,
          file.size,
          rowCount,
          columns.length
        ]
      );

      const datasetId = (result as any).insertId;

      // Auto-detect column types
      try {
        const typeResult = await DataTypeHandler.detectTypes(filePath, datasetId);
        
        if (typeResult) {
          // Store column types
          for (const [columnName, typeInfo] of Object.entries(typeResult.columns)) {
            await Database.query(
              `INSERT INTO column_types 
               (dataset_id, column_name, detected_type, original_dtype, metadata, created_at) 
               VALUES (?, ?, ?, ?, ?, NOW())`,
              [
                datasetId,
                columnName,
                typeInfo.detected_type,
                typeInfo.original_dtype,
                JSON.stringify(typeInfo)
              ]
            );
          }

          console.log(`Type detection completed for dataset ${datasetId}`);
        }
      } catch (typeError) {
        console.error('Type detection failed:', typeError);
        // Continue anyway - types can be detected later
      }

      // Return success response
      res.status(201).json({
        success: true,
        data: {
          id: datasetId,
          name,
          description,
          fileName,
          fileSize: file.size,
          rowCount,
          columnCount: columns.length,
          columns
        }
      });

    } catch (error) {
      console.error('Upload dataset error:', error);
      
      // Clean up file on error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete file:', unlinkError);
        }
      }

      res.status(500).json({ error: 'Failed to upload dataset' });
    }
  }

  /**
   * Get all datasets for user
   */
  static async getDatasets(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const datasets = await Database.query(
        `SELECT id, name, description, file_name, file_size, row_count, column_count, created_at, updated_at
         FROM datasets 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
        [userId]
      ) as Record<string, unknown>[];

      res.status(200).json({
        success: true,
        data: datasets
      });

    } catch (error) {
      console.error('Get datasets error:', error);
      res.status(500).json({ error: 'Failed to retrieve datasets' });
    }
  }

  /**
   * Get single dataset
   */
  static async getDataset(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { datasetId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const datasets = await Database.query(
        'SELECT * FROM datasets WHERE id = ? AND user_id = ?',
        [datasetId, userId]
      ) as Record<string, unknown>[];

      if (!datasets || datasets.length === 0) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      const dataset = datasets[0];

      // Get column types if available
      const columnTypes = await Database.query(
        'SELECT column_name, detected_type, metadata FROM column_types WHERE dataset_id = ?',
        [datasetId]
      ) as Record<string, unknown>[];

      const typesMap: Record<string, unknown> = {};
      for (const row of columnTypes) {
        typesMap[row.column_name as string] = {
          detected_type: row.detected_type,
          ...JSON.parse(row.metadata as string)
        };
      }

      res.status(200).json({
        success: true,
        data: {
          ...dataset,
          column_types: typesMap
        }
      });

    } catch (error) {
      console.error('Get dataset error:', error);
      res.status(500).json({ error: 'Failed to retrieve dataset' });
    }
  }

  /**
   * Delete dataset
   */
  static async deleteDataset(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { datasetId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get dataset info
      const datasets = await Database.query(
        'SELECT * FROM datasets WHERE id = ? AND user_id = ?',
        [datasetId, userId]
      ) as Record<string, unknown>[];

      if (!datasets || datasets.length === 0) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      const dataset = datasets[0];
      const filePath = dataset.file_path as string;

      // Delete file
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('Failed to delete file:', fileError);
      }

      // Delete from database (cascades to related tables)
      await Database.query(
        'DELETE FROM datasets WHERE id = ?',
        [datasetId]
      );

      res.status(200).json({
        success: true,
        message: 'Dataset deleted successfully'
      });

    } catch (error) {
      console.error('Delete dataset error:', error);
      res.status(500).json({ error: 'Failed to delete dataset' });
    }
  }

  /**
   * Get dataset preview
   */
  static async getDatasetPreview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { datasetId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get dataset
      const datasets = await Database.query(
        'SELECT * FROM datasets WHERE id = ? AND user_id = ?',
        [datasetId, userId]
      ) as Record<string, unknown>[];

      if (!datasets || datasets.length === 0) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      const dataset = datasets[0];
      const filePath = dataset.file_path as string;

      // Read CSV preview
      const rows: Record<string, unknown>[] = [];
      
      await new Promise<void>((resolve, reject) => {
        createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            if (rows.length < limit) {
              rows.push(row);
            }
          })
          .on('end', () => resolve())
          .on('error', (error) => reject(error));
      });

      res.status(200).json({
        success: true,
        data: {
          columns: rows.length > 0 ? Object.keys(rows[0]) : [],
          rows,
          total_rows: dataset.row_count
        }
      });

    } catch (error) {
      console.error('Get preview error:', error);
      res.status(500).json({ error: 'Failed to get dataset preview' });
    }
  }

  /**
   * Parse CSV columns
   */
  private static async parseCSVColumns(filePath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const columns: string[] = [];
      let headerParsed = false;

      createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headers: string[]) => {
          columns.push(...headers);
          headerParsed = true;
        })
        .on('data', () => {
          if (headerParsed) {
            // Stop after getting headers
            resolve(columns);
          }
        })
        .on('end', () => {
          if (!headerParsed && columns.length === 0) {
            reject(new Error('No columns found in CSV'));
          }
          resolve(columns);
        })
        .on('error', (error: Error) => reject(error));
    });
  }

  /**
   * Count CSV rows
   */
  private static async countCSVRows(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      let count = 0;

      createReadStream(filePath)
        .pipe(csv())
        .on('data', () => count++)
        .on('end', () => resolve(count))
        .on('error', (error: Error) => reject(error));
    });
  }
}