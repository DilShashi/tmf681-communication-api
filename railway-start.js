// railway-start.js
require('dotenv').config();
const app = require('./src/app');
const PORT = process.env.PORT || 8080;
console.log(`Starting app on port ${PORT}`); // <-- This log is critical

app.listen(PORT); // <-- Very important: no callback here

process.on('SIGTERM', () => console.log('SIGTERM received'));
process.on('SIGINT', () => console.log('SIGINT received'));
