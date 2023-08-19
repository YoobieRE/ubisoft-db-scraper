import schedule from 'node-schedule';
import mongoose from 'mongoose';
import L from '../common/logger';
import { config } from '../common/config';
import DemuxPool from '../demux/pool';
import { StoreServiceScraper } from '../demux/store-service/store-service-scraper';
import DiscordReporter from '../reports/discord';
import { DiscordBot } from '../bot/discord-bot';
import { Product } from '../schema/product';
import { ShopProductScraper } from '../store/shop/shop-scraper';

export interface ScrapeStoreServicePipelineProps {
  discordBot: DiscordBot;
}

export class ScrapeStoreServicePipeline {
  private discordBot: DiscordBot;

  constructor(props: ScrapeStoreServicePipelineProps) {
    this.discordBot = props.discordBot;
  }

  private async run() {
    const mongooseConnection = await mongoose.connect(config.dbConnectionString, {
      autoIndex: false,
    });
    try {
      const discordReporter = new DiscordReporter({
        discordBot: this.discordBot,
        updateChannels: config.discordUpdateChannels,
        logger: L,
        disabled: config.discordUpdatesDisabled,
      });
      const demuxPool = new DemuxPool({
        accounts: config.accounts,
        logger: L,
        throttleTime: config.throttleTime,
        demuxTimeout: config.demuxTimeout,
      });
      const storeServiceScraper = new StoreServiceScraper({
        demuxPool,
        logger: L,
        chunkSize: config.productIdChunkSize,
      });
      const productIds = [...Array(config.maxProductId).keys()];

      storeServiceScraper.on(
        'productUpdate',
        discordReporter.sendStoreServiceProductUpdate.bind(discordReporter)
      );

      const { updatedIds, associatedIds } = await storeServiceScraper.scrapeStore(productIds);

      const interestedIds = new Set([...updatedIds, ...associatedIds]);
      const interestedStoreProducts = await Product.find(
        { productId: { $in: Array.from(interestedIds) } },
        { 'storeProduct.ingame.storeReference': 1, 'storeProduct.upsell.storeReference': 1 }
      ).lean();
      const interestedShopIds = new Set<string>();
      interestedStoreProducts.forEach((p) => {
        if (p.storeProduct?.ingame?.storeReference) {
          interestedShopIds.add(p.storeProduct.ingame.storeReference);
        }
        if (p.storeProduct?.upsell?.storeReference) {
          interestedShopIds.add(p.storeProduct.upsell.storeReference);
        }
      });

      const shopScraper = new ShopProductScraper({ logger: L });
      shopScraper.on(
        'shopProductAdded',
        discordReporter.sendShopProductUpdate.bind(discordReporter)
      );
      shopScraper.on(
        'shopProductUpdated',
        discordReporter.sendShopProductUpdate.bind(discordReporter)
      );
      await shopScraper.scrape(interestedShopIds);

      await mongooseConnection.disconnect();
    } catch (err) {
      L.error(err);
      await mongooseConnection.disconnect();
    }
  }

  public schedule() {
    schedule.scheduleJob('1 * * * *', this.run.bind(this));
  }
}
