import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from './common/config';
import DemuxPool from './demux/pool';
import DbScraper from './demux/db-scraper';
import logger from './common/logger';
import ProductGitArchive from './reports/git';

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

  const productArchive = new ProductGitArchive({
    logger,
    remote: config.productArchiveRemote,
    token: config.githubToken,
    userName: config.gitUser,
    userEmail: config.gitEmail,
  });
  await productArchive.archive();

  await mongooseConnection.disconnect();
}

main();
