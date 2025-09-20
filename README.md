# URL to PDF API

A Node.js API server that converts web URLs to PDF documents using Puppeteer.

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

The server will run on `http://localhost:3000`.

## API Endpoints

### Health Check

- `GET /` - API information
- `GET /health` - Health check

### Generate PDF

- `POST /generate-pdf` - Generate PDF from URL (JSON body)
- `GET /generate-pdf` - Generate PDF from URL (query parameters)

## Usage Examples

### POST Request

```bash
curl -X POST http://localhost:3000/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com", "filename": "github.pdf"}' \
  --output github.pdf
```

### GET Request

```bash
curl "http://localhost:3000/generate-pdf?url=https://example.com&filename=example.pdf" \
  --output example.pdf
```

### Advanced Options

You can customize PDF generation by passing options in the POST request:

```json
{
  "url": "https://example.com",
  "filename": "custom.pdf",
  "options": {
    "format": "A3",
    "landscape": true,
    "margin": {
      "top": "50px",
      "bottom": "50px"
    }
  }
}
```

## Key Features

### Two API Endpoints

- `POST /generate-pdf` - Send URL in request body
- `GET /generate-pdf?url=https://example.com` - Send URL as query parameter

### Advanced PDF Generation with Puppeteer

- Optimized browser launch settings for production
- Network idle waiting for complete page loading
- Custom PDF options (A4, margins, headers/footers)
- Background graphics included

### Production-Ready Features

- Input validation and sanitization
- Error handling and logging
- CORS support
- Health check endpoint
- Graceful shutdown handling

## Docker

Build and run with Docker:

```bash
docker build -t url-to-pdf-api .
docker run -p 3000:3000 url-to-pdf-api
```

## Dependencies

- Node.js >= 14.0.0
- Express
- Puppeteer

## License

MIT
