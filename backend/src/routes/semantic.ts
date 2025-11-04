import express from 'express';
import { SemanticController } from '../controllers/SemanticController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Start semantic analysis
router.post('/datasets/:datasetId/semantic-analysis', authenticateToken, SemanticController.analyzeDataset);

// Get semantic analysis results
router.get('/datasets/:datasetId/semantic-analysis', authenticateToken, SemanticController.getSemanticResults);

// Get analysis status
router.get('/datasets/:datasetId/semantic-analysis/status', authenticateToken, SemanticController.getAnalysisStatus);

// Environment management
router.get('/semantic/environment', authenticateToken, SemanticController.checkEnvironment);
router.post('/semantic/install-dependencies', authenticateToken, SemanticController.installDependencies);

export default router;