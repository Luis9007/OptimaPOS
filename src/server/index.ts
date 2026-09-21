/**
 * @file index.ts (src/server/index.ts)
 * @description Punto de entrada para el arranque del Servidor Backend Node.js.
 */

import fs from 'fs';
import app from './app';

if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Ignorar si el archivo no se puede cargar
  }
}

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend Node.js ejecutándose en http://localhost:${PORT}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️ Puerto ${PORT} ya está en uso. Continuando con la instancia activa...`);
  } else {
    console.error('Error en el servidor backend:', err);
  }
});

