import { validateEnv } from '../config/env.js';
import { runAllScanners } from '../services/scannerService.js';

validateEnv();

try {
  const runs = await runAllScanners();
  console.log(JSON.stringify({ runs }, null, 2));
} catch (error) {
  console.error('Deal scanner failed.');
  console.error(error.message);
  console.error('If this mentions scanner_runs, deal_sources, or raw_deal_mentions, run supabase/migrations/002_deal_scanner_schema.sql in Supabase first.');
  process.exit(1);
}
