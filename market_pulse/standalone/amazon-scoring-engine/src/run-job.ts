import { runAmazonJob } from './modules/lead-machine/amazon/amazon.job';

async function main(): Promise<void> {
  const jobId = process.argv[2]?.trim();
  if (!jobId) {
    console.error('Usage: bun run start -- <jobId>');
    process.exit(1);
  }

  await runAmazonJob(jobId);
  console.log(`Amazon job completed: ${jobId}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
  console.error(`Amazon job failed: ${message}`);
  process.exit(1);
});
