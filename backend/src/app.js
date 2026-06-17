const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/config');

// Import routes
const routes = require('./routes');
const webhookController = require('./controllers/webhookController');
const stripeController = require('./controllers/stripeController');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.corsOrigin || 'http://localhost:5173',
  credentials: true
}));

// Stripe webhook MUST receive the raw body for signature verification, so it is
// mounted BEFORE the JSON body parser. All other routes use parsed JSON below.
app.post('/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  webhookController.handleStripeWebhook);

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Mount routes
app.use('/api', routes);

// Public short payment link → 302 redirect to the Stripe Checkout page
app.get('/pay/:code', stripeController.redirectShortLink);

// 404 handler - FIXED VERSION
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Redact secrets (e.g. ?key=, ?api_key=, tokens) from any string before logging.
const redactSecrets = (str) =>
  typeof str === 'string'
    ? str.replace(/([?&](?:key|api_key|apikey|access_token|token)=)[^&\s]+/gi, '$1[REDACTED]')
    : str;

// Global error handler
app.use((err, req, res, next) => {
  // Log only safe, redacted fields — never the full error object (axios errors
  // embed the outbound request URL, which can contain the Google API key).
  console.error('Global error handler:', {
    message: redactSecrets(err.message),
    status: err.status,
    url: redactSecrets(err.config?.url),
    stack: config.nodeEnv === 'development' ? redactSecrets(err.stack) : undefined,
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

module.exports = app;