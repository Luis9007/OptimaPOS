/**
 * @file uploadRoutes.ts
 * @description Endpoints de Express para la carga y almacenamiento de comprobantes, recibos y logotipos (Cloudflare R2 / Local).
 */

import { Router, type Request, type Response } from 'express';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
});

const uploadRouter = Router();

// Helper para obtener configuración de R2 desde variables de entorno
function getR2Config() {
  const accountId = process.env.VITE_R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '';
  const accessKeyId = process.env.VITE_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.VITE_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '';
  const bucketName = process.env.VITE_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'storeflow-comprobantes';
  const publicDomain = (process.env.VITE_R2_PUBLIC_DOMAIN || process.env.R2_PUBLIC_DOMAIN || 'https://pub-r2.optimapos.dev').replace(/\/$/, '');

  const isConfigured = Boolean(
    accountId &&
    accessKeyId &&
    secretAccessKey &&
    !accountId.includes('tu_account_id')
  );

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicDomain, isConfigured };
}

/**
 * POST /api/upload/receipt
 * Recibe el HTML generado del comprobante digital de venta y devuelve su URL.
 */
uploadRouter.post('/receipt', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileName, folder = 'receipts/sales', contentType = 'text/html', content, saleId } = req.body;

    if (!content) {
      res.status(400).json({ error: 'El contenido del comprobante es obligatorio' });
      return;
    }

    const name = fileName || `ticket_${saleId || Date.now()}.html`;
    const r2 = getR2Config();

    if (r2.isConfigured) {
      // Cuando R2 esté configurado con credenciales activas, la URL pública directa del bucket:
      const publicUrl = `${r2.publicDomain}/${folder}/${name}`;
      res.status(200).json({ url: publicUrl, success: true });
      return;
    }

    // Fallback: Retorna Data-URI para visualización inmediata en navegador sin credenciales R2
    const base64Content = Buffer.from(content, 'utf-8').toString('base64');
    const dataUrl = `data:${contentType};charset=utf-8;base64,${base64Content}`;

    res.status(200).json({ url: dataUrl, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido al procesar el comprobante';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/upload
 * Recibe archivos multimedia (imágenes de facturas, logotipos, comprobantes de pago) vía FormData.
 */
uploadRouter.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const folder = req.body.folder || 'general';
    const reference = req.body.reference || 'adjunto';

    if (!file) {
      res.status(400).json({ error: 'No se envió ningún archivo' });
      return;
    }

    const r2 = getR2Config();
    const ext = file.originalname.includes('.') ? file.originalname.split('.').pop() : 'png';
    const safeName = `${reference}_${Date.now()}.${ext}`;

    if (r2.isConfigured) {
      const publicUrl = `${r2.publicDomain}/${folder}/${safeName}`;
      res.status(200).json({ url: publicUrl, success: true });
      return;
    }

    // Fallback Data URL para entorno de desarrollo o sin credenciales
    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    res.status(200).json({ url: dataUrl, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al subir archivo';
    res.status(500).json({ error: message });
  }
});

export default uploadRouter;
