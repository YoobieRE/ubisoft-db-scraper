import { game_configuration, ownership_service, store_service } from 'ubisoft-demux';
import yaml from 'yaml';
import deepEqual from 'fast-deep-equal';
import pRetry from 'p-retry';
import { Logger } from 'pino';
import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { IStoreTypeProductMap, Product, ProductDocument } from '../schema/product';
import { ProductRevision } from '../schema/product-revision';
import { chunkArray } from '../common/util';
import DemuxPool from './pool';

export type DbScraperEvents = {
  productUpdate: (newProduct: ProductDocument, oldProduct?: ProductDocument) => void;
};

export type StoreTypeKey = 'upsell' | 'ingame' | 'unrecognized';
export const storeTypeNameMap: Record<store_service.StoreType, StoreTypeKey> = {
  [store_service.StoreType.StoreType_Upsell]: 'upsell',
  [store_service.StoreType.StoreType_Ingame]: 'ingame',
  [store_service.StoreType.UNRECOGNIZED]: 'unrecognized',
};

export interface DbScraperProps {
  demuxPool: DemuxPool;
  logger: Logger;
  maxProductId?: number;
  productIdChunkSize?: number;
  maxRetries?: number;
}

export default class DbScraper extends (EventEmitter as new () => TypedEmitter<DbScraperEvents>) {
  private demuxPool: DemuxPool;

  private maxProductId = 10000;

  private productIdChunkSize = 1000;

  private L: Logger;

  private retryOptions: pRetry.Options;

  constructor(props: DbScraperProps) {
    super();
    this.demuxPool = props.demuxPool;
    this.maxProductId = props.maxProductId ?? this.maxProductId;
    this.productIdChunkSize = props.productIdChunkSize ?? this.productIdChunkSize;
    this.L = props.logger;
    this.retryOptions = {
      retries: props.maxRetries ?? 5,
      onFailedAttempt: (err) => this.L.debug(err),
    };
  }

  public async scrapeStore(): Promise<void> {
    this.L.info('a');
  }

  // eslint-disable-next-line consistent-return
  public async updateProduct(
    productId: number,
    currentProduct?: ProductDocument | null,
    newStoreProduct?: IStoreTypeProductMap
  ): Promise<ProductDocument | undefined> {
    try {
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
        this.L.debug({ productId, newStoreProduct }, 'Got latest product config');
      }
      this.L.trace({ productId, newStoreProduct }, 'Got latest product config');
      const configuration = configResp.response?.getProductConfigRsp?.configuration;
      if (
        configResp.response?.getProductConfigRsp?.result !==
          ownership_service.GetProductConfigRsp_Result.Result_Success &&
        !currentProduct &&
        newStoreProduct === undefined
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

      if (!currentProduct) {
        // If no document exists create a new one
        this.L.debug({ productId }, 'No current product exists, creating a one');
        const newProduct = new Product({
          _id: productId,
          productId,
          storeProduct: newStoreProduct,
          configuration: configParsed,
        });
        this.L.trace({ newProduct }, 'inserting new product');
        await newProduct.save();
        this.emit('productUpdate', newProduct);
        return newProduct;
      }

      if (newStoreProduct || !deepEqual(currentProduct.configuration, configParsed)) {
        // If there is a change in the document
        this.L.info({ productId }, 'A change was detected. Updating the product');
        // Save the old document
        const oldProduct = await ProductRevision.create({
          ...currentProduct.toObject(),
          _id: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        });
        // Don't overwrite existing storeProduct with undefined
        if (newStoreProduct) currentProduct.set({ storeProduct: newStoreProduct });
        currentProduct.set({ configuration: configParsed });
        // Update the document
        await currentProduct.save();
        this.emit('productUpdate', currentProduct, oldProduct);
        return currentProduct;
      }
    } catch (err) {
      this.L.warn(err);
      return undefined;
    }
  }

  public async scrapeConfigurations(): Promise<void> {
    const productIds = [...Array(this.maxProductId).keys()];
    this.L.info(
      `Scraping configs for product IDs ${productIds[0]}-${productIds[productIds.length - 1]}`
    );

    await Promise.all(
      chunkArray(productIds, this.productIdChunkSize).map(async (productIdsChunk, index) => {
        this.L.debug(`Getting current products for chunk ${index}`);
        const currentProducts = await Product.find({
          _id: { $in: productIdsChunk },
        });
        const currentProductsMap = new Map(
          currentProducts.map((product) => [product._id, product])
        );
        await Promise.all(
          productIdsChunk.map(async (productId) => {
            const currentProduct = currentProductsMap.get(productId);
            await this.updateProduct(productId, currentProduct);
          })
        );
      })
    );
  }
}
