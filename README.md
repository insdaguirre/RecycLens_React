# RecycLens MVP

An AI-powered recycling assistant that helps users identify recyclable items and find nearby recycling facilities.

## Features

- **Image Analysis**: Upload a photo of an item to identify its materials
- **Recyclability Assessment**: Get instant feedback on whether an item can be recycled
- **Local Facilities**: Find nearby recycling and disposal facilities using web search
- **Interactive Map**: View facilities on an interactive Mapbox map with markers
- **Clear Instructions**: Receive step-by-step guidance for proper disposal

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **AI Services**: OpenAI Vision API + OpenAI Assistants API (with web search)
- **Maps**: Mapbox GL JS + React Map GL

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Mapbox access token ([Get one here](https://account.mapbox.com/access-tokens/)) - Required for map functionality

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
VITE_MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token-here
PORT=3001
NODE_ENV=development
```

**Note:** The Mapbox token uses the `VITE_` prefix because Vite requires this for frontend environment variables.

**Note:** The Mapbox access token is required for the interactive map feature. Without it, the map will not display, but other features will still work.

### 3. Run Development Servers

You need to run both the frontend and backend servers:

**Terminal 1 - Backend Server:**
```bash
npm run server
```

The backend will start on `http://localhost:3001`

**Terminal 2 - Frontend Server:**
```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is taken)

### 4. Open in Browser

Navigate to `http://localhost:5173` to use the application.

## Deployment

### Railway Deployment

RecycLens is configured for easy deployment on Railway. See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) for detailed deployment instructions.

**Quick Steps:**
1. Connect your GitHub repository to Railway
2. Add environment variables:
   - `OPENAI_API_KEY`
   - `VITE_MAPBOX_ACCESS_TOKEN`
   - `NODE_ENV=production`
3. Railway will automatically build and deploy

The application will be available at a Railway-provided URL (e.g., `https://your-app.railway.app`).

## How It Works

1. **User uploads an image** of an item they want to recycle
2. **Vision API analyzes** the image to identify materials and condition
3. **GPT-5 Assistant** (with web search) determines recyclability and finds local facilities
4. **Results are displayed** with instructions and facility information

## API Endpoints

### POST /api/analyze

Analyzes an item for recyclability.

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "location": "Ithaca, NY 14850",
  "context": "Plastic container with food residue"
}
```

**Response:**
```json
{
  "isRecyclable": true,
  "category": "Plastic",
  "bin": "recycling",
  "confidence": 0.87,
  "materialDescription": "Plastic bottle",
  "instructions": [
    "Rinse the container thoroughly",
    "Remove any labels if possible",
    "Place in recycling bin"
  ],
  "reasoning": "This is a clean plastic container that can be recycled.",
  "locationUsed": "Ithaca, NY 14850",
  "facilities": [
    {
      "name": "Green Valley Recycling",
      "type": "Recycling Center",
      "address": "123 Main St, Ithaca, NY",
      "url": "https://example.com",
      "notes": "Accepts plastic containers"
    }
  ]
}
```

## Example cURL Request

```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "location": "Ithaca, NY 14850",
    "context": "Plastic bottle"
  }'
```

## Project Structure

```
RecycLens/
├── server/                 # Backend Express server
│   ├── index.ts           # Server entry point
│   ├── routes/            # API routes
│   │   └── analyze.ts     # Main analysis endpoint
│   ├── services/          # Business logic
│   │   ├── visionService.ts    # Vision API integration
│   │   └── gpt5Service.ts      # Assistants API integration
│   └── types.ts           # Backend types
├── src/                    # Frontend React app
│   ├── components/        # React components
│   │   ├── ImageUpload.tsx
│   │   ├── ResultsPanel.tsx
│   │   ├── FacilityCard.tsx
│   │   └── FacilityMap.tsx
│   ├── hooks/             # Custom React hooks
│   │   └── useAnalyzeItem.ts
│   ├── utils/             # Utility functions
│   │   ├── api.ts         # API client
│   │   └── geocoding.ts   # Mapbox geocoding utility
│   └── types/             # TypeScript types
│       └── recycleiq.ts
├── recycleiq-interface.tsx # Main UI component
├── vite.config.ts         # Vite configuration
└── package.json
```

## Troubleshooting

### Backend won't start

- Check that `OPENAI_API_KEY` is set in `.env`
- Ensure port 3001 is not in use
- Check console for error messages

### Frontend can't connect to backend

- Ensure backend server is running on port 3001
- Check Vite proxy configuration in `vite.config.ts`
- Verify CORS is enabled in backend

### API errors

- Verify your OpenAI API key is valid and has credits
- Check that you have access to Vision API and Assistants API
- Review server logs for detailed error messages

### Image upload issues

- Ensure image is less than 10MB
- Supported formats: JPEG, PNG, GIF, WebP
- Check browser console for errors

### Map not displaying

- Verify `VITE_MAPBOX_ACCESS_TOKEN` is set in `.env` (frontend needs this, note the VITE_ prefix)
- Check browser console for Mapbox-related errors
- Ensure the token has the correct scopes (Geocoding API and Maps API)
- Map will only display when facilities are available
- Restart the dev server after adding the environment variable

## Development Notes

- The backend uses OpenAI Assistants API with web search tool for facility lookup
- Vision API analyzes images to identify materials
- Frontend uses Vite proxy to route `/api/*` requests to Express backend
- Both servers must be running simultaneously for the app to work

## License

© 2025 RecycLens. Making recycling simple.

