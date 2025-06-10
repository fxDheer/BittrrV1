module.exports = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  corsOrigin: 'https://bittrr.com',
  nodeEnv: 'production',
  logLevel: 'info',
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  ssl: {
    enabled: true,
    key: process.env.SSL_KEY_PATH,
    cert: process.env.SSL_CERT_PATH
  }
}; 