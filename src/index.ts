import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from './config';
import DemuxPool from './demux/pool';
import DbScraper from './demux/db-scraper';
import logger from './logger';

const maxProductId = 10000;

async function main() {
  const mongooseConnection = await mongoose.connect('mongodb://localhost:27017/ubi', {
    autoIndex: false,
  });

  const demuxPool = new DemuxPool({ accounts: config.accounts, logger });
  const ownershipPool = await demuxPool.getOwnershipPool();

  const scraper = new DbScraper({
    ownershipPool,
    logger,
    maxProductId,
  });

  await scraper.scrapeManifests();

  await demuxPool.destroy();
  await mongooseConnection.disconnect();
}

main();
