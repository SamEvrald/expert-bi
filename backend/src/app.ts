import express from 'express';
import authRoutes from './routes/auth';
import datasetRoutes from './routes/datasets';
import profilingRoutes from './routes/profiling';
import semanticRoutes from './routes/semantic';
import insightRoutes from './routes/insights';
import dashboardRoutes from './routes/dashboard';

const app = express();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/profiling', profilingRoutes);
app.use('/api/semantic', semanticRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/dashboard', dashboardRoutes); // Add this line

export default app;