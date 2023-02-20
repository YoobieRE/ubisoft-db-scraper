import { Logger } from 'pino';
import { store_service } from 'ubisoft-demux';
import deepEqual from 'fast-deep-equal';
import TTLCache from '@isaacs/ttlcache';
import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import DemuxPool from '../pool';
import {
  IExpandedStoreProduct,
  IStoreTypeProductMap,
  Product,
  ProductDocument,
} from '../../schema/product';
import { chunkArray } from '../../common/util';

export type StoreTypeKey = 'upsell' | 'ingame' | 'unrecognized';
export const storeTypeNameMap: Record<store_service.StoreType, StoreTypeKey> = {
  [store_service.StoreType.StoreType_Upsell]: 'upsell',
  [store_service.StoreType.StoreType_Ingame]: 'ingame',
  [store_service.StoreType.UNRECOGNIZED]: 'unrecognized',
};

export interface StoreServiceScrapeResult {
  /**
   * Any root IDs that detected an update
   */
  updatedIds: Set<number>;
  /**
   * Any IDs uni-directionally associated with the products that detected updates
   */
  associatedIds: Set<number>;
}

export type StoreServiceScraperEvents = {
  productUpdate: (
    newStoreProduct: IStoreTypeProductMap,
    oldStoreProduct?: IStoreTypeProductMap
  ) => void;
};

export interface StoreServiceScraperProps {
  demuxPool: DemuxPool;
  logger: Logger;
  chunkSize?: number;
}

export class StoreServiceScraper extends (EventEmitter as new () => TypedEmitter<StoreServiceScraperEvents>) {
  static cache = new TTLCache<string, IExpandedStoreProduct>({ ttl: 60 * 60 * 1000 }); // 1 hour

  private demuxPool: DemuxPool;

  private chunkSize = 1000;

  private L: Logger;

  constructor(props: StoreServiceScraperProps) {
    super();
    this.demuxPool = props.demuxPool;
    this.chunkSize = props.chunkSize ?? this.chunkSize;
    this.L = props.logger;
  }

  /**
   * Search through a list of productIds and detect changes with the previously known state
   * @param productIds A total list of productIds to search
   * @returns a set of productIds that had changes
   */
  public async scrapeStore(productIds: number[]): Promise<StoreServiceScrapeResult> {
    this.L.info({ productIdsSize: productIds.length }, `Scraping score data for product IDs`);
    const updatedIds = new Set<number>();
    const associatedIds = new Set<number>();
    await Promise.all(
      chunkArray(productIds, this.chunkSize).map(async (productIdsChunk) => {
        const storeData = await Promise.all([
          this.getStoreData(store_service.StoreType.StoreType_Ingame, productIdsChunk),
          this.getStoreData(store_service.StoreType.StoreType_Upsell, productIdsChunk),
        ]);
        const currentProducts = await Product.find({
          _id: { $in: productIdsChunk },
        });
        this.L.debug(`Received ${currentProducts.length} current products`);
        const currentProductsMap = new Map<number, ProductDocument>();
        currentProducts.forEach((currentProduct) => {
          currentProductsMap.set(currentProduct._id, currentProduct);
        });

        productIdsChunk.forEach((productId) => {
          const currentProduct = currentProductsMap.get(productId);
          const storeProductMapCreation: IStoreTypeProductMap = {};

          ['ingame', 'upsell'].forEach((storeTypeName, storeTypeIndex) => {
            const storeProduct = storeData[storeTypeIndex].get(productId);
            if (storeProduct) {
              storeProductMapCreation[storeTypeName as keyof IStoreTypeProductMap] = storeProduct;
            }
          });

          // Set to undefined if no keys
          const storeProductMap = Object.keys(storeProductMapCreation).length
            ? storeProductMapCreation
            : undefined;
          const currentStoreProduct = currentProduct?.toObject().storeProduct;

          // Detect changes
          if (
            storeProductMap &&
            (!currentProduct || !deepEqual(currentStoreProduct, storeProductMap))
          ) {
            // Mark productId as updated
            this.L.debug(`Detected change in store productId ${productId}`);
            this.emit('productUpdate', storeProductMap, currentStoreProduct);
            updatedIds.add(productId);

            // Mark all associated products as updated
            if (storeProductMap) {
              Object.values(storeProductMap).forEach((storeProduct: IExpandedStoreProduct) => {
                if (storeProduct) {
                  this.getAssociatedProductIds([storeProduct]).forEach((associatedId) =>
                    associatedIds.add(associatedId)
                  );
                }
              });
            }
          }
        });
      })
    );

    this.L.info(
      { updatedIdsCount: updatedIds.size, associatedIdsCount: associatedIds.size },
      'Store service scraping results'
    );
    return { updatedIds, associatedIds };
  }

  private async getStoreData(
    storeType: store_service.StoreType,
    productIds: number[]
  ): Promise<Map<number, IExpandedStoreProduct>> {
    const typeName = storeTypeNameMap[storeType];

    const productIdsToFetch = productIds.filter(
      (productId) => !StoreServiceScraper.cache.has(`${storeType}:${productId}`)
    );

    const storeConnection = await this.demuxPool.getConnection('store_service');
    const storeDataResp = await storeConnection.request({
      request: {
        requestId: 1,
        getDataReq: {
          storeDataType: storeType,
          productId: productIdsToFetch,
        },
      },
    });
    this.L.debug({ fetchedIds: productIdsToFetch.length }, `Got ${typeName} store data for chunk`);

    const newStoreProducts: IExpandedStoreProduct[] =
      storeDataResp.toJSON().response?.getDataRsp?.products || [];
    this.L.debug(
      { newStoreProductsSize: newStoreProducts.length },
      `Received ${typeName} store products`
    );
    newStoreProducts.forEach((product) => {
      const expandedProduct = product;
      if (product?.configuration) {
        expandedProduct.configuration = JSON.parse(
          Buffer.from(product.configuration as string, 'base64').toString('utf8')
        );
      }
      expandedProduct?.associations?.sort((a, b) => a - b);
      expandedProduct?.ownershipAssociations?.sort((a, b) => a - b);
      StoreServiceScraper.cache.set(`${storeType}:${product.productId}`, expandedProduct);
    });

    const storeProductMap = new Map<number, IExpandedStoreProduct>();
    productIds.forEach((productId) => {
      const storeProduct = StoreServiceScraper.cache.get(`${storeType}:${productId}`);
      if (storeProduct) storeProductMap.set(productId, storeProduct);
    });
    return storeProductMap;
  }

  /**
   * Gets any mentioned productIds from a store payload
   * @param storeProducts A list of store product data to inspect
   * @returns A set of productIds found, including the input productId
   */
  private getAssociatedProductIds(storeProducts: IExpandedStoreProduct[]): Set<number> {
    const associatedIds = new Set<number>();
    storeProducts.forEach((storeProduct) => {
      // TODO: handle upsell additionalContent and gamePackages
      [storeProduct.associations, storeProduct.ownershipAssociations].forEach((associationList) => {
        if (associationList?.length) {
          associationList.forEach((associatedId) => {
            associatedIds.add(associatedId);
          });
        }
      });
    });
    this.L.debug(
      {
        inputStoreProductCount: storeProducts.length,
        associatedIdsCount: associatedIds.size,
      },
      'Found store product associations'
    );
    return associatedIds;
  }
}
