import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import webhookRouter from './routes/webhook.js';
import { processAIService } from './services/aiService.js';
import { sendTextMessage } from './services/wasender.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security CORS configuration
const allowedOrigins = [
  config.appUrl,
  'http://localhost:3000',
  'http://localhost:5173',
  'https://wasenderapi.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(null, true); // Allow for production webhooks & clients
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static React production build files from dist
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// WASenderAPI Production Webhook Route (/api/webhooks/wasender and /api/webhook)
app.use('/api/webhooks', webhookRouter);
app.use('/api/webhook', webhookRouter);

// AI Test Simulator Route
app.post('/api/ai/test', async (req, res) => {
  try {
    const { incomingMessage, history, agentConfig, products } = req.body;
    const result = await processAIService({
      senderPhone: '+22500000000',
      incomingMessage: incomingMessage || 'Bonjour',
      history: history || [],
      agentConfig: agentConfig || {},
      products: products || [],
      currentScore: 0
    });
    res.json(result);
  } catch (error) {
    console.error('AI Test Route Error:', error);
    res.json({ replyText: 'Je vais vérifier cela pour vous.' });
  }
});

// WASender Outbound Message Route
app.post('/api/wasender/send-message', async (req, res) => {
  try {
    const { to, text } = req.body;
    if (to && text) {
      await sendTextMessage(to, text);
    }
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Health check API endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Komiya WhatsApp AI Production Platform',
    appUrl: config.appUrl,
    wasenderApiConnected: Boolean(config.wasender.apiKey)
  });
});

// Fallback all SPA routes to React index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 Komiya WhatsApp AI Production Server Running!`);
  console.log(`🌐 Public App URL: ${config.appUrl}`);
  console.log(`📌 Public Webhook URL: ${config.appUrl}/api/webhooks/wasender`);
  console.log(`====================================================`);
});
