import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './lib/logger';

// Route imports
import authRoutes from './modules/auth/routes';
import investorRoutes from './modules/investors/routes';
import dealRoutes from './modules/deals/routes';
import dashboardRoutes from './modules/dashboard/routes';
import outreachRoutes from './modules/outreach/routes';
import voiceRoutes from './modules/voice/routes';
import dispositionRoutes from './modules/disposition/routes';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Global Middleware ──────────────────────────────────────

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
}));

// ─── Health Check ───────────────────────────────────────────

app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// ─── API Routes ─────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/disposition', dispositionRoutes);

// ─── Error Handler ──────────────────────────────────────────

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    });
});

// ─── Start Server ───────────────────────────────────────────

app.listen(PORT, () => {
    logger.info(`🏨 Hotel Capital AI API running on port ${PORT}`);
    logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`   Health: http://localhost:${PORT}/health`);
});

export default app;
