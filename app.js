const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Utility function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Utility function to sanitize filename
function sanitizeFilename(url) {
  return url
    .replace(/https?:\/\//, '')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .substring(0, 50);
}

// PDF generation function
async function generatePDF(url, options = {}) {
  let browser;
  try {
    // Launch browser with optimized settings
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Navigate to the URL with timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait a bit more for any lazy-loaded content
    await page.waitForTimeout(2000);

    // Default PDF options
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; margin: auto;"></div>',
      footerTemplate: '<div style="font-size: 10px; margin: auto; color: #666;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      ...options
    };

    // Generate PDF
    const pdf = await page.pdf(pdfOptions);

    await browser.close();
    return pdf;

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

// Routes

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'URL to PDF API is running',
    endpoints: {
      'GET /health': 'Health check',
      'POST /generate-pdf': 'Generate PDF from URL',
      'GET /generate-pdf': 'Generate PDF from URL (query params)'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// POST endpoint for PDF generation
app.post('/generate-pdf', async (req, res) => {
  try {
    const { url, filename, options = {} } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        example: { url: 'https://example.com', filename: 'optional-name.pdf' }
      });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log(`Generating PDF for: ${url}`);

    const pdf = await generatePDF(url, options);
    const pdfFilename = filename || `${sanitizeFilename(url)}.pdf`;

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
    res.setHeader('Content-Length', pdf.length);

    // Send PDF
    res.send(pdf);

  } catch (error) {
    console.error('Error generating PDF:', error.message);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET endpoint for PDF generation (alternative)
app.get('/generate-pdf', async (req, res) => {
  try {
    const { url, filename } = req.query;

    if (!url) {
      return res.status(400).json({
        error: 'URL parameter is required',
        example: '/generate-pdf?url=https://example.com&filename=optional-name.pdf'
      });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log(`Generating PDF for: ${url}`);

    const pdf = await generatePDF(url);
    const pdfFilename = filename || `${sanitizeFilename(url)}.pdf`;

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
    res.setHeader('Content-Length', pdf.length);

    // Send PDF
    res.send(pdf);

  } catch (error) {
    console.error('Error generating PDF:', error.message);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 URL to PDF API server is running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});