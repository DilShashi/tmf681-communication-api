// src/app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const config = require('./config/tmf-config');
const logger = require('./utils/logger');
const TMFErrorHandler = require('./utils/tmfErrorHandler');

const loadModels = () => {
  require('./models/CommunicationMessage');
  require('./models/Attachment');
  require('./models/Characteristic');
  require('./models/CharacteristicRelationship');
  require('./models/Receiver');
  require('./models/Sender');
  require('./models/Event');
  require('./models/Quantity');
  require('./models/RelatedParty');
};
loadModels();

const communicationRoutes = require('./routes/communicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const hubRoutes = require('./routes/hubRoutes');
const clientRoutes = require('./routes/clientRoutes');

const app = express();
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET','POST','PATCH','DELETE'], allowedHeaders: ['Content-Type','Accept'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

mongoose.connect(process.env.DB_URL || config.database.url, { 
  useNewUrlParser: true, useUnifiedTopology: true 
}).then(() => {
  logger.info('MongoDB connected (simplified)');
}).catch(err => {
  logger.error('MongoDB connection error (simplified):', err);
  process.exit(1);
});

app.use(`${config.api.basePath}/communicationMessage`, communicationRoutes);
app.use(`${config.api.basePath}/notification`, notificationRoutes);
app.use(`${config.api.basePath}/hub`, hubRoutes);
app.use(`${config.api.basePath}/listener`, clientRoutes);

app.get(`${config.api.basePath}/health`, (req, res) => res.json({ status: 'UP' }));
app.use((req, res) => { res.status(404).json({ error: 'Not found' }); });
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message }); });

module.exports = app;
