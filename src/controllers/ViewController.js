// src/controllers/ViewController.js
const path = require('path');
const fs = require('fs');
const config = require('../config/tmf-config');

class ViewController {
  static async getApiHome(req, res) {
    try {
      // Read the HTML template
      const htmlPath = path.join(__dirname, '../views/api-home.html');
      let html = fs.readFileSync(htmlPath, 'utf8');
      
      // Replace template variables
      html = html
        .replace(/{{API_BASE_PATH}}/g, config.api.basePath)
        .replace(/{{API_VERSION}}/g, config.api.version)
        .replace(/{{API_TITLE}}/g, config.api.title)
        .replace(/{{TIMESTAMP}}/g, new Date().toISOString());
      
      res.status(200).set('Content-Type', 'text/html').send(html);
    } catch (err) {
      res.status(500).json({
        code: 500,
        reason: "Internal Server Error",
        message: "Could not load API homepage",
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = ViewController;