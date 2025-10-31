import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Servidor proxy que protege el backend y reenvía el tráfico del frontend
 * únicamente a los endpoints expuestos por el API Gateway.
 */
const app = express();
const port = process.env.PORT || 3000;
const backendPort = process.env.BACKEND_PORT;
const target =
  process.env.TARGET_API ||
  (backendPort ? `http://api-gateway:${backendPort}` : 'http://api-gateway:8080');

app.use(cors({ origin: true, credentials: false }));
app.use(morgan('dev'));
app.set('trust proxy', 2);
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.disable('x-powered-by');

app.use(
  '/api',
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { '^/api': '/api' },
    secure: true,
    onProxyReq: (proxyReq, req) => {
      proxyReq.removeHeader?.('cookie');
      Object.entries(req.headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'cookie' && value !== undefined) {
          proxyReq.setHeader(key, value);
        }
      });
    },
  }),
);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API Proxy listening on http://0.0.0.0:${port} -> ${target}`);
});
