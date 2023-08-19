import { Logger } from 'pino';
import { game_configuration, ownership_service } from 'ubisoft-demux';
import deepEqual from 'fast-deep-equal';
import TTLCache from '@isaacs/ttlcache';
import yaml from 'yaml';
import DemuxPool from './pool';
import { Product, ProductDocument } from '../schema/product';
import { chunkArray } from '../common/util';

export interface ConfigScraperProps {
  demuxPool: DemuxPool;
  logger: Logger;
  chunkSize?: number;
}

export class ConfigScraper {
  static cache = new TTLCache<number, game_configuration.Configuration | string>({
    ttl: 60 * 60 * 1000,
  }); // 1 hour

  private demuxPool: DemuxPool;

  private chunkSize = 1000;

  private L: Logger;

  constructor(props: ConfigScraperProps) {
    this.demuxPool = props.demuxPool;
    this.chunkSize = props.chunkSize ?? this.chunkSize;
    this.L = props.logger;
  }

  /**
   * Search through a list of productIds and detect changes with the previously known state
   * @param productIds A total list of productIds to search
   * @returns a set of productIds that had changes
   */
  public async scrapeConfig(productIds: number[]): Promise<Set<number>> {
    this.L.info({ productIdsSize: productIds.length }, `Scraping config data for product IDs`);
    const updatedConfigProducts = new Set<number>();
    await Promise.all(
      chunkArray(productIds, this.chunkSize).map(async (productIdsChunk) => {
        const configResults = new Map<number, string | game_configuration.Configuration>();
        await Promise.all(
          productIdsChunk.map(async (productId) => {
            const configResult = await this.getConfigData(productId);
            if (configResult) {
              configResults.set(productId, configResult);
            }
          })
        );

        const currentProducts = await Product.find({
          _id: { $in: productIdsChunk },
        });
        this.L.debug(`Received ${currentProducts.length} current products`);
        const currentProductsMap = new Map<number, ProductDocument>();
        currentProducts.forEach((currentProduct) => {
          currentProductsMap.set(currentProduct._id, currentProduct);
        });

        configResults.forEach((configResult, productId) => {
          const currentProduct = currentProductsMap.get(productId);
          const currentProductConfig = currentProduct?.toObject().configuration;

          // Detect changes
          if ((!currentProduct && configResult) || !deepEqual(currentProductConfig, configResult)) {
            // Mark productId as updated
            this.L.debug({ productId }, `Detected change in config`);
            updatedConfigProducts.add(productId);
          }
        });
      })
    );

    this.L.info(`Found ${updatedConfigProducts.size} potentially updated config products`);
    return updatedConfigProducts;
  }

  private async getConfigData(
    productId: number
  ): Promise<game_configuration.Configuration | string | undefined> {
    const productConfig = ConfigScraper.cache.get(productId);
    if (productConfig) return productConfig;

    const ownershipConnection = await this.demuxPool.getConnection('ownership_service');
    const configResp = await ownershipConnection.request({
      request: {
        requestId: 1,
        getProductConfigReq: {
          deprecatedTestConfig: false,
          productId,
        },
      },
    });
    if (productId % 50 === 0) {
      this.L.debug({ productId }, 'Got latest product config');
    } else {
      this.L.trace({ productId }, 'Got latest product config');
    }
    const configuration = configResp.response?.getProductConfigRsp?.configuration;
    if (
      configResp.response?.getProductConfigRsp?.result !==
      ownership_service.GetProductConfigRsp_Result.Result_Success
    ) {
      this.L.trace(
        { productId, result: configResp.response?.getProductConfigRsp?.result },
        'Product ID does not exist'
      );
      return undefined;
    }
    let configParsed: game_configuration.Configuration | string | undefined;
    try {
      configParsed = configuration
        ? yaml.parse(configuration, {
            uniqueKeys: false,
            strict: false,
          })
        : undefined;
    } catch (err) {
      if (err.name !== 'YAMLParseError') throw err;
      // Ubisoft's YAML can have syntax errors (see 1483). If so, we just store it as a string
      this.L.warn({ productId, configuration }, 'Raw string configuration');
      this.L.warn(err, 'Storing configuration as string');
      configParsed = configuration;
    }
    if (configParsed) ConfigScraper.cache.set(productId, configParsed);
    return configParsed;
  }
}
