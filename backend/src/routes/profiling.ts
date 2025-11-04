import express from 'express';
import { ProfilingController } from '../controllers/ProfilingController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Profile dataset
router.post('/datasets/:datasetId/profile', authenticateToken, ProfilingController.profileDataset);

// Get profiling results
router.get('/datasets/:datasetId/profile', authenticateToken, ProfilingController.getProfilingResults);

// Get profiling status
router.get('/datasets/:datasetId/profile/status', authenticateToken, ProfilingController.getProfilingStatus);

export default router;