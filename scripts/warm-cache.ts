/**
 * Cache warming script for post-deployment
 *
 * Warms both edge cache (HTTP) and serverless instance cache by making
 * requests to the most popular search queries.
 *
 * Usage:
 *   tsx scripts/warm-cache.ts
 *   tsx scripts/warm-cache.ts --url https://unicon.sh
 */

const POPULAR_QUERIES = [
  "home",
  "user",
  "settings",
  "search",
  "notification",
  "menu",
  "close",
  "check",
  "arrow",
  "heart",
  "star",
  "upload",
  "download",
  "edit",
  "delete",
  "calendar",
  "mail",
  "phone",
  "location",
  "lock",
  "share",
  "copy",
  "file",
  "folder",
  "image",
  "video",
  "play",
  "pause",
  "stop",
  "refresh",
];

async function warmCache(baseUrl: string) {
  console.log(`🔥 Warming cache for ${baseUrl}...`);
  console.log(`   Queries: ${POPULAR_QUERIES.length}`);
  console.log();

  let successCount = 0;
  let errorCount = 0;

  for (const query of POPULAR_QUERIES) {
    const url = `${baseUrl}/api/icons?q=${encodeURIComponent(query)}&limit=20`;

    try {
      const startTime = Date.now();
      const response = await fetch(url);
      const duration = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log(`✓ ${query.padEnd(15)} ${duration}ms (${data.icons?.length || 0} icons, ${data.searchType})`);
        successCount++;
      } else {
        console.log(`✗ ${query.padEnd(15)} HTTP ${response.status}`);
        errorCount++;
      }
    } catch (error) {
      console.log(`✗ ${query.padEnd(15)} ${error instanceof Error ? error.message : 'Error'}`);
      errorCount++;
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log();
  console.log(`✅ Cache warming complete`);
  console.log(`   Success: ${successCount}/${POPULAR_QUERIES.length}`);
  console.log(`   Errors: ${errorCount}`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const urlArg = args.find(arg => arg.startsWith('--url='));
const baseUrl: string = urlArg
  ? urlArg.split('=')[1]!
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

warmCache(baseUrl).catch(error => {
  console.error('❌ Cache warming failed:', error);
  process.exit(1);
});
