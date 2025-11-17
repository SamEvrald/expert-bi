import { Router } from 'express';
import { DatasetController } from '../controllers/DatasetController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Upload dataset
router.post('/datasets', authMiddleware, DatasetController.uploadMiddleware, DatasetController.uploadDataset);

// Get all datasets
router.get('/datasets', authMiddleware, DatasetController.getDatasets);

// Get single dataset
router.get('/datasets/:datasetId', authMiddleware, DatasetController.getDataset);

// Delete dataset
router.delete('/datasets/:datasetId', authMiddleware, DatasetController.deleteDataset);

// Get dataset preview
router.get('/datasets/:datasetId/preview', authMiddleware, DatasetController.getDatasetPreview);

export default router;