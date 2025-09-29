const { Dataset } = require('../models');
const CSVAnalysisService = require('../services/CSVAnalysisService');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const ApiResponse = require('../utils/ApiResponse');
const AppError = require('../utils/AppError');

class DatasetController {
  static async uploadDataset(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json(
          ApiResponse.error('No file uploaded', 400)
        );
      }

      console.log('File upload details:', {
        originalname: req.file.originalname,
        key: req.file.key,
        size: req.file.size,
        mimetype: req.file.mimetype,
        location: req.file.location,
        bucket: req.file.bucket
      });

      // Check if S3 upload was successful
      if (!req.file.key || !req.file.location) {
        return res.status(500).json(
          ApiResponse.error('File upload to S3 failed', 500)
        );
      }

      const { projectId } = req.body;

      // Create dataset record
      const dataset = await Dataset.create({
        projectId,
        userId: req.user.id,
        originalName: req.file.originalname,
        fileName: req.file.key.split('/').pop(),
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        s3Key: req.file.key,
        s3Url: req.file.location,
        status: 'processing'
      });

      // Start analysis in background (in a real app, you'd use a queue)
      setImmediate(async () => {
        try {
          // Download file from S3 and analyze
          const response = await fetch(dataset.s3Url);
          const csvText = await response.text();
          
          const analysis = await CSVAnalysisService.analyze(csvText);
          
          // Update dataset with analysis results
          await dataset.update({
            status: 'completed',
            rowCount: analysis.rowCount,
            columnCount: analysis.columns.length,
            analysisData: analysis,
            processedAt: new Date()
          });
        } catch (error) {
          console.error('Analysis failed:', error);
          await dataset.update({
            status: 'error',
            errorMessage: error.message
          });
        }
      });

      res.status(201).json(
        ApiResponse.success(dataset, 'File uploaded successfully and analysis started')
      );
    } catch (error) {
      // If dataset creation failed but file was uploaded, clean up
      if (req.file && req.file.key) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: req.file.bucket,
            Key: req.file.key
          });
          await s3Client.send(deleteCommand);
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded file:', cleanupError);
        }
      }
      next(error);
    }
  }

  static async getDatasets(req, res, next) {
    try {
      const { projectId } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      const offset = (page - 1) * limit;
      
      const whereClause = {
        userId: req.user.id,
        ...(projectId && { projectId }),
        ...(status && { status })
      };

      const { count, rows: datasets } = await Dataset.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['analysisData'] } // Exclude heavy analysis data from list
      });

      res.json(
        ApiResponse.success({
          datasets,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }, 'Datasets retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getDataset(req, res, next) {
    try {
      const { id } = req.params;

      const dataset = await Dataset.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!dataset) {
        return res.status(404).json(
          ApiResponse.notFound('Dataset not found')
        );
      }

      res.json(
        ApiResponse.success(dataset, 'Dataset retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getDatasetAnalysis(req, res, next) {
    try {
      const { id } = req.params;

      const dataset = await Dataset.findOne({
        where: {
          id,
          userId: req.user.id,
          status: 'completed'
        }
      });

      if (!dataset) {
        return res.status(404).json(
          ApiResponse.notFound('Dataset not found or analysis not completed')
        );
      }

      if (!dataset.analysisData) {
        return res.status(404).json(
          ApiResponse.notFound('Analysis data not available')
        );
      }

      res.json(
        ApiResponse.success(dataset.analysisData, 'Analysis retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async deleteDataset(req, res, next) {
    try {
      const { id } = req.params;

      const dataset = await Dataset.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!dataset) {
        return res.status(404).json(
          ApiResponse.notFound('Dataset not found')
        );
      }

      // Delete file from S3
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET || 'expert-bi-datasets',
          Key: dataset.s3Key
        });
        await s3Client.send(deleteCommand);
      } catch (s3Error) {
        console.error('Failed to delete file from S3:', s3Error);
        // Continue with database deletion even if S3 deletion fails
      }

      // Delete from database
      await dataset.destroy();

      res.json(
        ApiResponse.success(null, 'Dataset deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async reanalyzeDataset(req, res, next) {
    try {
      const { id } = req.params;

      const dataset = await Dataset.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!dataset) {
        return res.status(404).json(
          ApiResponse.notFound('Dataset not found')
        );
      }

      // Update status to processing
      await dataset.update({
        status: 'processing',
        analysisData: null,
        processedAt: null,
        errorMessage: null
      });

      // Start reanalysis in background
      setImmediate(async () => {
        try {
          const response = await fetch(dataset.s3Url);
          const csvText = await response.text();
          
          const analysis = await CSVAnalysisService.analyze(csvText);
          
          await dataset.update({
            status: 'completed',
            rowCount: analysis.rowCount,
            columnCount: analysis.columns.length,
            analysisData: analysis,
            processedAt: new Date()
          });
        } catch (error) {
          console.error('Reanalysis failed:', error);
          await dataset.update({
            status: 'error',
            errorMessage: error.message
          });
        }
      });

      res.json(
        ApiResponse.success(dataset, 'Dataset reanalysis started')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DatasetController;