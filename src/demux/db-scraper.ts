import { game_configuration, ownership_service, store_service } from 'ubisoft-demux';
import yaml from 'yaml';
import deepEqual from 'fast-deep-equal';
import pRetry from 'p-retry';
import { Logger } from 'pino';
import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import {
  IExpandedStoreProduct,
  IStoreTypeProductMap,
  Product,
  ProductDocument,
} from '../schema/product';
import { ProductRevision } from '../schema/product-revision';
import { chunkArray } from '../common/util';
import { ConnectionUnit } from './pool';

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
  connectionPool: ConnectionUnit[];
  logger: Logger;
  maxProductId?: number;
  productIdChunkSize?: number;
  maxRetries?: number;
}

export default class DbScraper extends (EventEmitter as new () => TypedEmitter<DbScraperEvents>) {
  private connectionPool: ConnectionUnit[];

  private maxProductId = 10000;

  private productIdChunkSize = 1000;

  private L: Logger;

  private retryOptions: pRetry.Options;

  constructor(props: DbScraperProps) {
    super();
    this.connectionPool = props.connectionPool;
    this.maxProductId = props.maxProductId ?? this.maxProductId;
    this.productIdChunkSize = props.productIdChunkSize ?? this.productIdChunkSize;
    this.L = props.logger;
    this.retryOptions = {
      retries: props.maxRetries ?? 5,
      onFailedAttempt: (err) => this.L.debug(err),
    };
  }

  public async scrapeStore(): Promise<void> {
    const productIds = [...Array(this.maxProductId).keys()];
    this.L.info(
      `Scraping score data for product IDs ${productIds[0]}-${productIds[productIds.length - 1]}`
    );
    try {
      const allStoreProductsMap: Record<StoreTypeKey, Map<number, IExpandedStoreProduct>> = {
        ingame: new Map(),
        upsell: new Map(),
        unrecognized: new Map(),
      };
      const allCurrentProducts = new Map<number, ProductDocument>();
      const updatedStoreProducts = new Map<number, IStoreTypeProductMap | undefined>();
      await Promise.all(
        chunkArray(productIds, this.productIdChunkSize).map(async (productIdsChunk, index) => {
          const accountIndex = index % this.connectionPool.length;
          const { limiter, storeConnection } = this.connectionPool[accountIndex];
          const firstProductId = productIdsChunk[0];
          const lastProductId = productIdsChunk[productIdsChunk.length - 1];

          /**
           * Generic function to get and manipulate store data for both upsell and ingame
           * @param storeType upsell or ingame enum value
           * @returns All the products and associated products returned for the batch
           */
          const getStoreData = async (
            storeType: store_service.StoreType
          ): Promise<IExpandedStoreProduct[]> => {
            const typeName = storeTypeNameMap[storeType];
            const storeDataResp = await pRetry(
              async () =>
                limiter.add(() => {
                  this.L.debug(
                    { accountIndex },
                    `Getting ${typeName} store data and current products for chunk ${firstProductId}-${lastProductId}`
                  );
                  return storeConnection.request({
                    request: {
                      requestId: 1,
                      getDataReq: {
                        storeDataType: storeType,
                        productId: productIdsChunk,
                      },
                    },
                  });
                }),
              this.retryOptions
            );
            const newStoreProducts: IExpandedStoreProduct[] =
              storeDataResp.toJSON().response?.getDataRsp?.products || [];
            this.L.debug(`Received ${newStoreProducts.length} ${typeName} store products`);
            const newStoreProductsExpanded = newStoreProducts.map((product) => {
              const expandedProduct = product;
              if (product?.configuration) {
                expandedProduct.configuration = JSON.parse(
                  Buffer.from(product.configuration, 'base64').toString('utf8')
                );
              }
              expandedProduct?.associations?.sort((a, b) => a - b);
              expandedProduct?.ownershipAssociations?.sort((a, b) => a - b);
              return expandedProduct;
            });
            newStoreProductsExpanded.forEach((product) => {
              if (!product.productId) return;
              allStoreProductsMap[typeName].set(product.productId, product);
            });
            return newStoreProductsExpanded;
          };

          await Promise.all([
            getStoreData(store_service.StoreType.StoreType_Upsell),
            getStoreData(store_service.StoreType.StoreType_Ingame),
          ]);
          const currentProducts = await Product.find({
            _id: { $gte: firstProductId, $lte: lastProductId },
          });
          this.L.debug(`Received ${currentProducts.length} current products`);
          currentProducts.forEach((currentProduct) => {
            allCurrentProducts.set(currentProduct._id, currentProduct);
          });

          productIdsChunk.forEach((productId) => {
            const currentProduct = allCurrentProducts.get(productId);
            const storeProductMapCreation: IStoreTypeProductMap = {};

            Object.keys(allStoreProductsMap).forEach((storeTypeName) => {
              const storeProduct =
                allStoreProductsMap[storeTypeName as StoreTypeKey].get(productId);
              if (storeProduct) {
                storeProductMapCreation[storeTypeName as keyof IStoreTypeProductMap] = storeProduct;
              }
            });

            // Set to undefined if no keys
            const storeProductMap = Object.keys(storeProductMapCreation).length
              ? storeProductMapCreation
              : undefined;
            const currentStoreProduct = currentProduct?.toObject().storeProduct;
            if (
              (!currentProduct && storeProductMap) ||
              !deepEqual(currentStoreProduct, storeProductMap)
            ) {
              // Mark productId as updated
              this.L.debug(`Detected change in store productId ${productId}`);
              updatedStoreProducts.set(productId, storeProductMap);

              // Mark all associated products as updated
              if (storeProductMap) {
                Object.values(storeProductMap).forEach((storeProduct?: IExpandedStoreProduct) => {
                  [storeProduct?.associations, storeProduct?.ownershipAssociations].forEach(
                    (associationList) => {
                      if (associationList?.length) {
                        associationList.forEach((associatedId) => {
                          if (
                            !updatedStoreProducts.get(associatedId) &&
                            associatedId < this.maxProductId
                          ) {
                            updatedStoreProducts.set(associatedId, undefined);
                          }
                        });
                      }
                    }
                  );
                });
              }
            }
          });
        })
      );

      this.L.info(`Found ${updatedStoreProducts.size} potentially updated store products`);

      await Promise.all(
        Array.from(updatedStoreProducts.entries()).map(async ([productId, storeProductMap]) => {
          const currentProduct = allCurrentProducts.get(productId);
          // TODO: remove any product IDs above this.maxProductId
          return this.updateProduct(productId, currentProduct, storeProductMap);
        })
      );
    } catch (err) {
      this.L.error(err);
    }
  }

  // eslint-disable-next-line consistent-return
  public async updateProduct(
    productId: number,
    currentProduct?: ProductDocument | null,
    newStoreProduct?: IStoreTypeProductMap
  ): Promise<ProductDocument | undefined> {
    const accountIndex = productId % this.connectionPool.length;
    const { limiter, ownershipConnection } = this.connectionPool[accountIndex];
    try {
      const configResp = await pRetry(
        async () =>
          limiter.add(() => {
            if (productId % 50 === 0) {
              this.L.debug(
                { productId, newStoreProduct, accountIndex },
                'Getting latest product config'
              );
            }
            this.L.trace(
              { productId, newStoreProduct, accountIndex },
              'Getting latest product config'
            );
            return ownershipConnection.request({
              request: {
                requestId: 1,
                getProductConfigReq: {
                  deprecatedTestConfig: false,
                  productId,
                },
              },
            });
          }),
        this.retryOptions
      );
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
      chunkArray(productIds, this.productIdChunkSize).map(async (productIdsChunk) => {
        const firstProductId = productIdsChunk[0];
        const lastProductId = productIdsChunk[productIdsChunk.length - 1];
        this.L.debug(`Getting current products for chunk ${firstProductId}-${lastProductId}`);
        const currentProducts = await Product.find({
          _id: { $gte: firstProductId, $lte: lastProductId },
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
