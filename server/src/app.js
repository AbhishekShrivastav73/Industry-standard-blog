
const express = require('express');
const app = express();
const morgan = require('morgan');
const compression = require('compression');

// Middlewares
app.use(morgan('dev'));
app.use(compression()); // Gzip compression for responses


// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Health Check Endpoint
// @Route - GET /health
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message : 'Server is up and running'
  });
});


// Routes
app.use('/api/auth', require('./features/Auth/auth.routes'));
app.use('/api/user', require('./features/Users/user.routes'));

module.exports = app;