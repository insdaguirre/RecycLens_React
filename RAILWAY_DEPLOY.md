# Railway Deployment Guide for RecycLens

This guide will help you deploy RecycLens to Railway.

## Prerequisites

1. A Railway account ([Sign up here](https://railway.app))
2. A GitHub account with your RecycLens repository
3. Your API keys ready:
   - OpenAI API Key
   - Mapbox Access Token

## Deployment Steps

### 1. Connect Your Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `RecycLens` repository
5. Railway will automatically detect it's a Node.js project

### 2. Configure Environment Variables

In your Railway project dashboard:

1. Go to your project → **Variables** tab
2. Add the following environment variables:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
VITE_MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token-here
NODE_ENV=production
```

**Important Notes:**
- Railway automatically sets the `PORT` variable - you don't need to set it manually
- The `VITE_MAPBOX_ACCESS_TOKEN` must have the `VITE_` prefix for the frontend to access it
- Railway will rebuild when you change environment variables

### 3. Configure Build Settings

Railway should auto-detect the build process, but you can verify:

1. Go to your service → **Settings** tab
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`

The `railway.json` file in the repo should handle this automatically.

### 4. Deploy

1. Railway will automatically start building and deploying
2. Watch the build logs in the Railway dashboard
3. Once deployed, Railway will provide you with a public URL (e.g., `https://your-app.railway.app`)

### 5. Verify Deployment

1. Visit your Railway-provided URL
2. Test the application:
   - Upload an image
   - Enter a location
   - Verify the analysis works
   - Check that the map loads correctly

## Troubleshooting

### Build Fails

- **Error: Missing dependencies**: Make sure `package.json` has all required dependencies
- **Error: TypeScript errors**: Check that all TypeScript files compile correctly
- **Error: Build timeout**: Railway has build time limits; ensure your build completes quickly

### Runtime Errors

- **Error: OPENAI_API_KEY not set**: Verify environment variables are set correctly
- **Error: Mapbox token missing**: Ensure `VITE_MAPBOX_ACCESS_TOKEN` is set
- **Error: Port already in use**: Railway sets PORT automatically; don't override it

### Frontend Not Loading

- **White screen**: Check browser console for errors
- **API calls failing**: Verify the API routes are working (check `/health` endpoint)
- **Map not showing**: Verify `VITE_MAPBOX_ACCESS_TOKEN` is set correctly

### Check Logs

1. Go to your Railway project
2. Click on your service
3. Go to **Deployments** tab
4. Click on the latest deployment
5. View **Logs** to see runtime errors

## Custom Domain (Optional)

1. Go to your Railway project → **Settings**
2. Click **Generate Domain** or add a custom domain
3. Railway will provide SSL certificates automatically

## Monitoring

- Railway provides basic metrics in the dashboard
- Check the **Metrics** tab for CPU, memory, and network usage
- Set up alerts if needed

## Updating Your Deployment

Railway automatically deploys when you push to your connected GitHub branch:

1. Make changes locally
2. Commit and push to GitHub
3. Railway will automatically detect and deploy the changes

You can also trigger manual deployments from the Railway dashboard.

## Cost Considerations

- Railway offers a free tier with usage limits
- Monitor your usage in the dashboard
- Consider upgrading if you exceed free tier limits

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check Railway status: https://status.railway.app

