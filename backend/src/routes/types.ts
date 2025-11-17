import { Router } from 'express';
import { TypeDetectionController } from '../controllers/TypeDetectionController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Detect column types
router.post('/datasets/:datasetId/detect-types', authMiddleware, TypeDetectionController.detectTypes);

// Get column types
router.get('/datasets/:datasetId/column-types', authMiddleware, TypeDetectionController.getColumnTypes);

// Get chart suggestions
router.get('/datasets/:datasetId/chart-suggestions', authMiddleware, TypeDetectionController.getChartSuggestions);

export default router;