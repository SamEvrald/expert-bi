import express from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Dashboard CRUD
router.post('/datasets/:datasetId/dashboards', authenticateToken, DashboardController.createDashboard);
router.get('/datasets/:datasetId/dashboards', authenticateToken, DashboardController.getDashboards);
router.get('/dashboards/:dashboardId', authenticateToken, DashboardController.getDashboard);
router.put('/dashboards/:dashboardId', authenticateToken, DashboardController.updateDashboard);
router.delete('/dashboards/:dashboardId', authenticateToken, DashboardController.deleteDashboard);

// Chart operations
router.get('/datasets/:datasetId/columns', authenticateToken, DashboardController.getDatasetColumns);
router.post('/datasets/:datasetId/chart-data', authenticateToken, DashboardController.getChartData);

export default router;