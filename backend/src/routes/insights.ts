import { Router } from 'express';
import { InsightsController } from '../controllers/InsightsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Generate insights
router.post('/datasets/:datasetId/insights', authMiddleware, InsightsController.generateInsights);

// Get insights
router.get('/datasets/:datasetId/insights', authMiddleware, InsightsController.getInsights);

// Get comprehensive analysis
router.get('/datasets/:datasetId/analysis', authMiddleware, InsightsController.getComprehensiveAnalysis);

// Test Python connection
router.get('/test-python', authMiddleware, InsightsController.testPythonConnection);

export default router;