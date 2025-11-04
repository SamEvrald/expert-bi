import express from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Generate dashboard
router.post('/datasets/:datasetId/dashboard', authenticateToken, DashboardController.generateDashboard);

// Get dashboard configuration
router.get('/datasets/:datasetId/dashboard', authenticateToken, DashboardController.getDashboard);

// Get dashboard status
router.get('/datasets/:datasetId/dashboard/status', authenticateToken, DashboardController.getDashboardStatus);

// Get dashboard preview
router.get('/datasets/:datasetId/dashboard/preview', authenticateToken, DashboardController.getDashboardPreview);

// Update dashboard
router.put('/datasets/:datasetId/dashboard', authenticateToken, DashboardController.updateDashboard);

// Regenerate dashboard
router.post('/datasets/:datasetId/dashboard/regenerate', authenticateToken, DashboardController.regenerateDashboard);

// Export dashboard
router.get('/datasets/:datasetId/dashboard/export', authenticateToken, DashboardController.exportDashboard);

// Get chart data
router.post('/datasets/:datasetId/dashboard/charts/:chartId/data', authenticateToken, DashboardController.getChartData);

export default router;