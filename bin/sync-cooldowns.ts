#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';

/**
 * clawharbor Cooldown Sync — Auto-create/update cron jobs from config
 * 
 * Reads clawharbor.config.json and syncs cooldown timers to OpenClaw cron jobs.
 */

const CONFIG_PATHS = [
  join(process.cwd(), 'clawharbor.config.json'),
  join(homedir(), '.openclaw', 'clawharbor.config.json'),
];

const OPENCLAW_CONFIG = join(homedir(), '.openclaw', 'openclaw.json');
const JOB_NAME_PREFIX = 'clawharbor-cooldown-';

interface CooldownConfig {
  default?: string;
  agents?: Record<string, string>;
  quiet?: {
    enabled?: boolean;
    start?: string;
    end?: string;
    timezone?: string;
    behavior?: 'pause' | 'skip';
  };
}

interface CronJob {
  id: string;
  name: string;
  agentId?: string;
  enabled: boolean;
  schedule: any;
  payload: any;
  sessionTarget: string;
}

/**
 * Parse interval string like "10m", "5s", "2h" to milliseconds
 */
function parseInterval(str: string): number {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) throw new Error(`Invalid interval: ${str}`);
  const [, num, unit] = match;
  const n = parseInt(num, 10);
  const multipliers: Record<string, number> = { 
    s: 1000, 
    m: 60000, 
    h: 3600000, 
    d: 86400000 
  };
  return n * multipliers[unit];
}

/**
 * Read clawharbor.config.json
 */
function readConfig(): { cooldown?: CooldownConfig; agents?: any } {
  for (const path of CONFIG_PATHS) {
    if (existsSync(path)) {
      console.log(`📖 Reading config from ${path}`);
      return JSON.parse(readFileSync(path, 'utf-8'));
    }
  }
  console.log('⚠️  No clawharbor.config.json found. Exiting.');
  process.exit(0);
}

/**
 * Get list of agents from openclaw.json
 */
function getAgentList(): string[] {
  if (!existsSync(OPENCLAW_CONFIG)) {
    console.error('❌ OpenClaw config not found at:', OPENCLAW_CONFIG);
    process.exit(1);
  }
  const config = JSON.parse(readFileSync(OPENCLAW_CONFIG, 'utf-8'));
  const agentsList = config.agents?.list || [];
  return agentsList.map((a: any) => a.id);
}

/**
 * List existing cron jobs
 */
function listCronJobs(): CronJob[] {
  try {
    const output = execSync('openclaw cron list --json --all', { encoding: 'utf-8' });
    
    // Extract JSON from output (skip any warnings/banners)
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Failed to parse cron list output');
      process.exit(1);
    }
    
    const data = JSON.parse(jsonMatch[0]);
    return data.jobs || [];
  } catch (err) {
    console.error('❌ Failed to list cron jobs:', err);
    process.exit(1);
  }
}

/**
 * Create a cron job
 */
function createCronJob(agentId: string, intervalMs: number, quietConfig?: CooldownConfig['quiet']): void {
  const name = `${JOB_NAME_PREFIX}${agentId}`;
  const message = `Check for available work. Look at your task list, check if anyone assigned you something, or self-assign from the backlog. If nothing to do, go back to idle.`;
  
  // Build command
  const args = [
    'openclaw', 'cron', 'add',
    '--agent', agentId,
    '--name', `"${name}"`,
    '--every', `${intervalMs}ms`,
    '--session', 'main',
    '--system-event', `"${message}"`,
    '--wake', 'now',
  ];

  // Add quiet hours via cron expression if enabled
  if (quietConfig?.enabled) {
    // For now, we'll create the job without quiet hours constraint
    // OpenClaw doesn't support time-based conditionals in systemEvent jobs yet
    // This is a limitation we'll note in the output
    console.log(`  ⚠️  Quiet hours config detected but not yet supported for systemEvent jobs`);
  }

  try {
    execSync(args.join(' '), { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`  ✅ Created job: ${name}`);
  } catch (err) {
    console.error(`  ❌ Failed to create job for ${agentId}:`, err);
  }
}

/**
 * Update a cron job
 */
function updateCronJob(jobId: string, agentId: string, intervalMs: number): void {
  const args = [
    'openclaw', 'cron', 'edit', jobId,
    '--every', `${intervalMs}ms`,
    '--enable',
  ];

  try {
    execSync(args.join(' '), { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`  ✅ Updated job: ${JOB_NAME_PREFIX}${agentId}`);
  } catch (err) {
    console.error(`  ❌ Failed to update job ${jobId}:`, err);
  }
}

/**
 * Delete a cron job
 */
function deleteCronJob(jobId: string, jobName: string): void {
  try {
    execSync(`openclaw cron rm ${jobId}`, { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`  ✅ Deleted job: ${jobName}`);
  } catch (err) {
    console.error(`  ❌ Failed to delete job ${jobId}:`, err);
  }
}

/**
 * Main sync logic
 */
function main() {
  console.log('🔄 clawharbor Cooldown Sync\n');

  // Read config
  const config = readConfig();
  const cooldownConfig = config.cooldown || {};
  
  if (!cooldownConfig.default && !cooldownConfig.agents) {
    console.log('ℹ️  No cooldown config found. Nothing to sync.');
    process.exit(0);
  }

  // Get agent list
  const allAgents = getAgentList();
  console.log(`📋 Found ${allAgents.length} agents in OpenClaw config\n`);

  // List existing jobs
  const existingJobs = listCronJobs();
  const cooldownJobs = existingJobs.filter(j => j.name.startsWith(JOB_NAME_PREFIX));
  console.log(`🕐 Found ${cooldownJobs.length} existing cooldown jobs\n`);

  // Build target state: which agents should have cooldowns
  const targetCooldowns: Record<string, number> = {};
  
  for (const agentId of allAgents) {
    const interval = cooldownConfig.agents?.[agentId] || cooldownConfig.default;
    if (interval) {
      try {
        targetCooldowns[agentId] = parseInterval(interval);
      } catch (err) {
        console.error(`⚠️  Invalid interval for ${agentId}: ${interval}`);
      }
    }
  }

  console.log(`🎯 Target cooldowns for ${Object.keys(targetCooldowns).length} agents:\n`);
  for (const [agentId, ms] of Object.entries(targetCooldowns)) {
    console.log(`   ${agentId}: ${ms / 1000}s (${ms / 60000}m)`);
  }
  console.log();

  // Sync: create/update/delete
  let created = 0;
  let updated = 0;
  let deleted = 0;

  // Create or update jobs
  for (const [agentId, intervalMs] of Object.entries(targetCooldowns)) {
    const existingJob = cooldownJobs.find(j => j.name === `${JOB_NAME_PREFIX}${agentId}`);
    
    if (existingJob) {
      // Check if interval changed
      const currentInterval = existingJob.schedule?.everyMs;
      if (currentInterval !== intervalMs) {
        console.log(`🔧 Updating ${agentId} (${currentInterval}ms → ${intervalMs}ms)...`);
        updateCronJob(existingJob.id, agentId, intervalMs);
        updated++;
      } else {
        console.log(`✓ ${agentId} already synced (${intervalMs}ms)`);
      }
    } else {
      console.log(`➕ Creating cooldown for ${agentId} (${intervalMs}ms)...`);
      createCronJob(agentId, intervalMs, cooldownConfig.quiet);
      created++;
    }
  }

  // Delete orphaned jobs
  for (const job of cooldownJobs) {
    const agentId = job.name.replace(JOB_NAME_PREFIX, '');
    if (!targetCooldowns[agentId]) {
      console.log(`🗑️  Deleting orphaned job: ${job.name}...`);
      deleteCronJob(job.id, job.name);
      deleted++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ Sync complete!');
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Deleted: ${deleted}`);
  console.log(`   Total cooldown jobs: ${Object.keys(targetCooldowns).length}`);
  
  if (cooldownConfig.quiet?.enabled) {
    console.log('\n⚠️  Note: Quiet hours are configured but not yet implemented.');
    console.log('   This will be added in a future update.');
  }
  
  console.log('\n💡 Tip: Run "openclaw cron list" to view all jobs.');
}

// Run
try {
  main();
} catch (err) {
  console.error('\n❌ Sync failed:', err);
  process.exit(1);
}
