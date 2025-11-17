import { Request, Response } from 'express';
import { DataTypeHandler } from '../services/DataTypeHandler';
import Database from '../config/database';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export class TypeDetectionController {
  /**
   * Detect and store column types for a dataset
   */
  static async detectTypes(req: AuthRequest, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get dataset
      const dataset = await Database.query(
        'SELECT * FROM datasets WHERE id = ? AND user_id = ?',
        [datasetId, userId]
      ) as Record<string, unknown>[];

      if (!dataset || dataset.length === 0) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      const datasetInfo = dataset[0];
      const filePath = datasetInfo.file_path as string;

      // Detect types
      const typeResult = await DataTypeHandler.detectTypes(filePath, parseInt(datasetId));

      if (!typeResult) {
        return res.status(500).json({ error: 'Type detection failed' });
      }

      // Store type information in database
      await Database.query(
        'DELETE FROM column_types WHERE dataset_id = ?',
        [datasetId]
      );

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

      res.status(200).json({
        success: true,
        data: typeResult
      });

    } catch (error) {
      console.error('Type detection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get stored column types for a dataset
   */
  static async getColumnTypes(req: AuthRequest, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify ownership
      const dataset = await Database.query(
        'SELECT * FROM datasets WHERE id = ? AND user_id = ?',
        [datasetId, userId]
      ) as Record<string, unknown>[];

      if (!dataset || dataset.length === 0) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      // Get column types
      const columnTypes = await Database.query(
        'SELECT * FROM column_types WHERE dataset_id = ?',
        [datasetId]
      ) as Record<string, unknown>[];

      const typesMap: Record<string, unknown> = {};
      for (const row of columnTypes) {
        typesMap[row.column_name as string] = JSON.parse(row.metadata as string);
      }

      res.status(200).json({
        success: true,
        data: typesMap
      });

    } catch (error) {
      console.error('Get column types error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get chart suggestions based on column types
   */
  static async getChartSuggestions(req: AuthRequest, res: Response) {
    try {
      const { datasetId } = req.params;
      const { xAxis, yAxis } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!xAxis || !yAxis) {
        return res.status(400).json({ error: 'xAxis and yAxis are required' });
      }

      // Get column types
      const columnTypes = await Database.query(
        'SELECT * FROM column_types WHERE dataset_id = ? AND column_name IN (?, ?)',
        [datasetId, xAxis, yAxis]
      ) as Record<string, unknown>[];

      if (columnTypes.length !== 2) {
        return res.status(404).json({ error: 'Column types not found' });
      }

      const xType = JSON.parse(columnTypes.find(c => c.column_name === xAxis)?.metadata as string);
      const yType = JSON.parse(columnTypes.find(c => c.column_name === yAxis)?.metadata as string);

      const suggestions = DataTypeHandler.suggestChartTypes(xType, yType);

      res.status(200).json({
        success: true,
        data: suggestions
      });

    } catch (error) {
      console.error('Chart suggestions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}