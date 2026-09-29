import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db.js';
import registrationRoutes from './routes/registrationRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
await connectDB();

// Middleware
app.use(
  cors({
    origin: '*', // Allow frontend client
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve uploaded compressed files statically
app.use('/uploads', express.static(path.resolve('uploads')));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: 'jit_hackthon',
  });
});

// Mount Routes
app.use('/api', registrationRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    service: "JITUrnHACK '26 Registration API",
    status: 'Running',
    endpoints: {
      health: 'GET /api/health',
      register: 'POST /api/register',
      registrations: 'GET /api/registrations',
      stats: 'GET /api/registrations/stats',
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred',
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 JITUrnHACK '26 Backend server running at http://localhost:${PORT}`);
  console.log(`📡 Registration API available at http://localhost:${PORT}/api/register`);
});
