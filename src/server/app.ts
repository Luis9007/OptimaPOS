/**
 * @file app.ts (Server Backend Express)
 * @description Configuración principal de la aplicación Express.js (middlewares y enrutador).
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import apiRouter from './routes';

const app = express();

app.use(cors());
app.use(express.json());

// Registro global de la API REST bajo el prefijo /api
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir archivos estáticos del frontend si la carpeta dist existe (producción / Railway)
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Fallback para React Router SPA en Express 5
  app.get('{*splat}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export default app;
