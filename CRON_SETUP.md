# Favorites Cleanup Cron Job Setup

The favorites system automatically removes expired favorites after the free trial period. To enable automatic cleanup, set up a daily cron job.

## Endpoint

```
POST /api/favorites/cleanup
Headers: x-cron-secret: [CRON_SECRET]
```

## Setup Methods

### Option 1: EasyCron (Recommended for simple setup)
1. Go to https://www.easycron.com
2. Create a new cron job:
   - URL: `https://your-domain.com/api/favorites/cleanup`
   - Method: POST
   - Custom headers: `x-cron-secret: your-secret-here`
   - Frequency: Daily (0 2 * * *, runs at 2 AM)
3. Click "Save"

### Option 2: Node-based (Local Development)
Install `node-cron`:
```bash
npm install node-cron
```

Create `scripts/cleanup-cron.js`:
```javascript
const cron = require('node-cron');
const fetch = require('node-fetch');

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running favorites cleanup...');
  try {
    const response = await fetch('http://localhost:3000/api/favorites/cleanup', {
      method: 'POST',
      headers: {
        'x-cron-secret': process.env.CRON_SECRET
      }
    });
    const data = await response.json();
    console.log('Cleanup result:', data);
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
});

console.log('Cleanup cron job started. Press Ctrl+C to stop.');
```

Then run with: `node scripts/cleanup-cron.js`

### Option 3: Railway/Vercel Cron
For Railway, add to `railway.json`:
```json
{
  "buildCommand": "npm run build",
  "startCommand": "npm run dev",
  "envValuePrefix": "${{ secrets.",
  "variables": {
    "CRON_SECRET": "your-secret-here"
  }
}
```

## Environment Variables

Set these in your `.env.local`:
```
CRON_SECRET=your-secure-random-string-here
```

## What Gets Cleaned Up

The cleanup job:
- Finds all favorites where `expiresAt < now` AND `isPaid = false`
- Deletes them permanently
- Returns count of deleted records

## Testing

To manually trigger cleanup:
```bash
curl -X POST http://localhost:3000/api/favorites/cleanup \
  -H "x-cron-secret: your-secret-here"
```

Expected response:
```json
{
  "ok": true,
  "message": "Deleted X expired favorites",
  "deletedCount": X
}
```

## Monitoring

The cleanup runs silently in the background. To monitor:
1. Check server logs for cleanup execution
2. Monitor `FavoriteModel` for decreasing count of unpaid expired records
3. Set up alerts for cleanup failures (optional)
