import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import webhookRouter from './routes/webhook.js';
import { processAIService } from './services/aiService.js';
import { sendTextMessage } from './services/wasender.js';
import { tenantRegistry } from './services/tenantRegistry.js';

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

// Tenant Synchronization Endpoint (Auto-syncs business, agent, and products from UI)
app.post('/api/tenants/sync', (req, res) => {
  try {
    const { businessId, sessionId, phoneNumber, apiKey, businessData, agentConfig, products, faqs } = req.body;
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'businessId is required' });
    }

    const tenant = tenantRegistry.registerTenant({
      businessId,
      sessionId,
      phoneNumber,
      apiKey,
      businessData,
      agentConfig,
      products,
      faqs
    });

    res.json({ success: true, tenant });
  } catch (err) {
    console.error('Tenant sync error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Tenants Status & Health
app.get('/api/tenants/status', (req, res) => {
  const tenants = tenantRegistry.getAllTenants().map(t => ({
    id: t.id,
    name: t.businessData?.name,
    sessionId: t.sessionId,
    phoneNumber: t.phoneNumber,
    productsCount: t.products?.length || 0,
    updatedAt: t.updatedAt
  }));
  res.json({ count: tenants.length, tenants });
});

// AI Test Simulator Route
app.post('/api/ai/test', async (req, res) => {
  try {
    const { incomingMessage, history, agentConfig, products, businessData, faqs } = req.body;
    const result = await processAIService({
      senderPhone: '+22500000000',
      incomingMessage: incomingMessage || 'Bonjour',
      history: history || [],
      agentConfig: agentConfig || {},
      products: products || [],
      businessData: businessData || {},
      faqs: faqs || [],
      currentScore: 0
    });
    res.json(result);
  } catch (error) {
    console.error('AI Test Route Error:', error);
    res.json({ 
      replyText: "Bonjour ! Je suis à votre service pour vous orienter. Que souhaitez-vous découvrir aujourd'hui ?" 
    });
  }
});

// WASender Outbound Message Route
app.post('/api/wasender/send-message', async (req, res) => {
  try {
    const { to, text, apiKey } = req.body;
    if (to && text) {
      await sendTextMessage(to, text, apiKey);
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
    wasenderApiConnected: Boolean(config.wasender.apiKey),
    activeTenants: tenantRegistry.getAllTenants().length
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
