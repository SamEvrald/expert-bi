import { Request, Response } from 'express';
import { DataProfilingService } from '../services/DataProfilingService';
import Database from '../config/database';
import { S3StorageService } from '../services/S3StorageService';

interface ColumnMetadata {
  id: number;
  profile_id: number;
  column_name: string;
  data_type: string;
  null_count: number;
  unique_count: number;
  completeness: number;
  min_value: string | null;
  max_value: string | null;
  mean_value: number | null;
  median_value: number | null;
  std_dev: number | null;
  sample_values: string;
  created_at: Date;
}

export class ProfilingController {
  /**
   * Profile uploaded dataset
   */
  static async profileDataset(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get dataset info from database
      const dataset = await Database.query(
        'SELECT * FROM datasets WHERE id = ? AND user_id = ?',
        [datasetId, userId]
      );

      if (!dataset || dataset.length === 0) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      const datasetInfo = dataset[0];

      // Check if profiling already exists
      const existingProfile = await Database.query(
        'SELECT * FROM data_profiles WHERE dataset_id = ? AND user_id = ?',
        [datasetId, userId]
      );

      if (existingProfile && existingProfile.length > 0) {
        return res.status(200).json({
          success: true,
          message: 'Dataset already profiled',
          data: existingProfile[0]
        });
      }

      // Update profiling status to processing
      await Database.query(
        'INSERT INTO data_profiles (user_id, dataset_id, dataset_name, profiling_status) VALUES (?, ?, ?, ?)',
        [userId, datasetId, datasetInfo.name, 'processing']
      );

      // Start profiling in background
      setImmediate(async () => {
        try {
          const profile = await DataProfilingService.profileDataset(
            datasetInfo.file_path,
            parseInt(datasetId),
            datasetInfo.name,
            userId
          );

          // Store profiling results
          await Database.query(
            'UPDATE data_profiles SET metadata = ?, profiling_status = ? WHERE dataset_id = ? AND user_id = ?',
            [JSON.stringify(profile), 'completed', datasetId, userId]
          );

          // Store column metadata
          for (const column of profile.columns) {
            await Database.query(
              `INSERT INTO column_metadata 
               (profile_id, column_name, data_type, null_count, unique_count, completeness, 
                min_value, max_value, mean_value, median_value, std_dev, sample_values) 
               VALUES ((SELECT id FROM data_profiles WHERE dataset_id = ? AND user_id = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                datasetId, userId, column.name, column.dataType, column.nullCount,
                column.uniqueCount, column.completeness,
                column.statistics?.min?.toString() || null,
                column.statistics?.max?.toString() || null,
                column.statistics?.mean || null,
                column.statistics?.median || null,
                column.statistics?.stdDev || null,
                JSON.stringify(column.sampleValues)
              ]
            );
          }

        } catch (error) {
          console.error('Profiling error:', error);
          await Database.query(
            'UPDATE data_profiles SET profiling_status = ? WHERE dataset_id = ? AND user_id = ?',
            ['failed', datasetId, userId]
          );
        }
      });

      res.status(202).json({
        success: true,
        message: 'Dataset profiling started',
        data: { status: 'processing' }
      });

    } catch (error) {
      console.error('Profile dataset error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get profiling results
   */
  static async getProfilingResults(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get profiling results
      const profile = await Database.query(
        'SELECT * FROM data_profiles WHERE dataset_id = ? AND user_id = ?',
        [datasetId, userId]
      );

      if (!profile || profile.length === 0) {
        return res.status(404).json({ error: 'Profiling results not found' });
      }

      const profileData = profile[0];

      // Get column metadata
      const columnMetadata = await Database.query(
        'SELECT * FROM column_metadata WHERE profile_id = ?',
        [profileData.id]
      );

      res.status(200).json({
        success: true,
        data: {
          ...profileData,
          metadata: JSON.parse(profileData.metadata || '{}'),
          columns: columnMetadata.map((col: ColumnMetadata) => ({
            ...col,
            sample_values: JSON.parse(col.sample_values || '[]')
          }))
        }
      });

    } catch (error) {
      console.error('Get profiling results error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get profiling status
   */
  static async getProfilingStatus(req: Request, res: Response) {
    try {
      const { datasetId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const profile = await Database.query(
        'SELECT profiling_status, created_at, updated_at FROM data_profiles WHERE dataset_id = ? AND user_id = ?',
        [datasetId, userId]
      );

      if (!profile || profile.length === 0) {
        return res.status(404).json({ error: 'Profiling not found' });
      }

      res.status(200).json({
        success: true,
        data: profile[0]
      });

    } catch (error) {
      console.error('Get profiling status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}