import express from 'express';
import { InsightsController } from '../controllers/InsightsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Generate insights
router.post('/datasets/:datasetId/insights', authenticateToken, InsightsController.generateInsights);

// Get insights
router.get('/datasets/:datasetId/insights', authenticateToken, InsightsController.getInsights);

// Get insight status
router.get('/datasets/:datasetId/insights/status', authenticateToken, InsightsController.getInsightStatus);

// Get insights summary
router.get('/datasets/:datasetId/insights/summary', authenticateToken, InsightsController.getInsightsSummary);

// Get specific insight types
router.get('/datasets/:datasetId/insights/correlations', authenticateToken, InsightsController.getCorrelations);
router.get('/datasets/:datasetId/insights/trends', authenticateToken, InsightsController.getTrends);

export default router;