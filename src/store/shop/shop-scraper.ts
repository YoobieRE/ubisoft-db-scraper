import deepEqual from 'fast-deep-equal';
import { Logger } from 'pino';
import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import PRetry from 'p-retry';
import PQueue from 'p-queue';
import { ShopApi } from './shop-api';
import { chunkArray } from '../../common/util';
import * as shop from './shop-types';
import { siteIds } from './shop-types';
import { IShopProduct, ShopProduct, ShopProductDocument } from '../../schema/shop-product';
import { ShopProductRevision } from '../../schema/shop-product-revision';

export interface CurrencyCodeChunkCache {
  [productId: string]: shop.Product;
}

export interface SiteIDChunkCache {
  [currency: shop.CurrencyCode | string]: CurrencyCodeChunkCache;
}

export interface StoreProductChunkCache {
  [siteId: shop.SiteID | string]: SiteIDChunkCache;
}

export interface ShopProductScraperProps {
  logger: Logger;
}

export interface ShopProductScrapeResult {
  updatedIds: Set<string>;
  newIds: Set<string>;
}

export interface FetchAndUpdateProductsResult {
  updatedIds: Set<string>;
  relatedIds: Set<string>;
}

export interface ShopProductDbChangeSet {
  product: ShopProductDocument;
  revision?: ShopProductDocument;
}

export type ShopProductScraperEvents = {
  shopProductAdded: (newProduct: IShopProduct) => void;
  shopProductUpdated: (newProduct: IShopProduct, oldProduct: IShopProduct) => void;
};

export class ShopProductScraper extends (EventEmitter as new () => TypedEmitter<ShopProductScraperEvents>) {
  private shop = new ShopApi();

  private chunkSize = 24;

  private L: Logger;

  private limiter: PQueue = new PQueue({ concurrency: 2, interval: 0 });

  constructor(props: ShopProductScraperProps) {
    super();
    this.L = props.logger;
  }

  public async scrape(productIds: Set<string>): Promise<ShopProductScrapeResult> {
    const idChunks = chunkArray(Array.from(productIds), this.chunkSize);
    const knownIds = await this.getAllIds();
    const fetchUpdateResults = await Promise.all(
      idChunks.map((idChunk) => this.limiter.add(() => this.fetchAndUpdateProducts(idChunk)))
    );
    const updatedIds = new Set<string>();
    const newIds = new Set<string>();
    fetchUpdateResults.flat().forEach((res) => {
      if (res.updatedIds) res.updatedIds.forEach((id) => updatedIds.add(id));
      if (res.relatedIds)
        res.relatedIds.forEach((id) => {
          if (!knownIds.has(id)) newIds.add(id);
        });
    });
    this.L.info(
      { updatedIdsCount: updatedIds.size, newIdsCount: newIds.size },
      'Shop product scraping results'
    );
    return { updatedIds, newIds };
  }

  private async getAllIds(): Promise<Set<string>> {
    const shopDocs = await ShopProduct.find(
      {},
      {
        product: {
          id: 1,
          c_productDlcBaseString: 1,
          'master.master_id': 1,
          c_productOtherEditionsListString: 1,
          'variants.product_id': 1,
        },
      }
    );

    const ids = new Set<string>();
    const products = shopDocs.map((d) => d.product);
    this.addProductIdsToSet(products, ids, ids);
    this.L.debug({ idCount: ids.size }, 'Counted unique IDs in store product DB');
    return ids;
  }

  private async fetchAndUpdateProducts(
    idChunk: string[]
  ): Promise<Partial<FetchAndUpdateProductsResult>> {
    try {
      this.L.debug({ chunksRemaining: this.limiter.size }, 'Processing store pages for chunk');
      const currentChunkCache = await this.populateCurrentProductCache(idChunk);
      const chunkChangeSets = (
        await Promise.all(
          siteIds.map(async (siteId) =>
            this.fetchAndUpdateSiteProducts(idChunk, siteId, currentChunkCache)
          )
        )
      ).flat();
      const newProducts = chunkChangeSets.map((c) => c.product);
      const newRevisions = chunkChangeSets
        .map((c) => c.revision)
        .filter((c): c is ShopProductDocument => c !== undefined);
      await Promise.all([
        ShopProduct.insertMany(newProducts),
        ShopProductRevision.insertMany(newRevisions),
      ]);
      const result: FetchAndUpdateProductsResult = {
        updatedIds: new Set<string>(),
        relatedIds: new Set<string>(),
      };
      const changeSetProducts = chunkChangeSets.map((c) => c.product.product);
      this.addProductIdsToSet(changeSetProducts, result.updatedIds, result.relatedIds);
      return result;
    } catch (err) {
      this.L.error(err);
      return {};
    }
  }

  private async fetchAndUpdateSiteProducts(
    idChunk: string[],
    siteId: shop.SiteID,
    currentChunkCache: StoreProductChunkCache
  ): Promise<ShopProductDbChangeSet[]> {
    const siteCurrencies = ShopApi.getCurrenciesBySiteId(siteId);
    const siteChunkCache = currentChunkCache[siteId];
    return (
      await Promise.all(
        siteCurrencies.map(async (currency) =>
          this.fetchAndUpdateSiteCurrencyProducts(idChunk, siteId, currency, siteChunkCache)
        )
      )
    ).flat();
  }

  private async fetchAndUpdateSiteCurrencyProducts(
    idChunk: string[],
    siteId: shop.SiteID,
    currency: shop.CurrencyCode,
    siteChunkCache?: SiteIDChunkCache
  ): Promise<ShopProductDbChangeSet[]> {
    try {
      const result = await PRetry(
        async () => {
          try {
            return await this.shop.getProducts(idChunk, {
              siteId,
              currency,
              locale: undefined,
            });
          } catch (err) {
            if (
              (err as shop.StoreError).message.includes(
                "is currently offline and can't be accessed"
              )
            ) {
              return null;
            }
            this.L.debug({ siteId, currency, err });
            throw err;
          }
        },
        { retries: 3 }
      );
      if (!result) return [];
      this.L.trace({ getProductsCount: result.count, siteId, currency }, 'Shop getProducts result');
      if (result.data?.length) {
        const siteCurrencyChunkCache = siteChunkCache?.[currency];
        return result.data
          .map((product) => this.compareAndCreateProduct(product, siteId, siteCurrencyChunkCache))
          .filter((p): p is ShopProductDbChangeSet => p !== null);
      }
    } catch (err) {
      this.L.error({ siteId, currency, err });
    }
    return [];
  }

  private async populateCurrentProductCache(idChunk: string[]): Promise<StoreProductChunkCache> {
    const currentProducts = await ShopProduct.find(
      {
        'product.id': { $in: idChunk },
      },
      { 'product._id': 0 }
    );
    const currentChunkCache: StoreProductChunkCache = {};
    currentProducts.forEach((product) => {
      const {
        siteId,
        product: { id, currency },
      } = product;

      if (!currentChunkCache[siteId]) currentChunkCache[siteId] = {};
      if (!currentChunkCache[siteId][currency]) currentChunkCache[siteId][currency] = {};
      currentChunkCache[siteId][currency][id] = product.toObject().product;
    });
    this.L.trace({ currentProductsCount: currentProducts.length }, 'Populated chunk cache');
    return currentChunkCache;
  }

  private compareAndCreateProduct(
    product: shop.Product,
    siteId: shop.SiteID,
    siteCurrencyChunkCache?: CurrencyCodeChunkCache
  ): ShopProductDbChangeSet | null {
    const currentProduct = siteCurrencyChunkCache?.[product.id];
    if (currentProduct && deepEqual(currentProduct, product)) return null;

    this.L.debug(
      { productId: product.id, siteId, currency: product.currency },
      'New product or change detected'
    );
    try {
      const changeSet: ShopProductDbChangeSet = {
        product: new ShopProduct({
          siteId,
          product,
        }),
      };
      if (currentProduct) {
        changeSet.revision = new ShopProductRevision({
          siteId,
          product: currentProduct,
          createdAt: undefined,
          updatedAt: undefined,
        });
        this.emit(
          'shopProductUpdated',
          changeSet.product.toObject(),
          changeSet.revision.toObject()
        );
      } else {
        this.emit('shopProductAdded', changeSet.product.toObject());
      }
      return changeSet;
    } catch (err) {
      this.L.error({ siteId, id: product.id, err });
      return null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private addProductIdsToSet(
    products: shop.Product[],
    primaryIds: Set<string>,
    relatedIds: Set<string>
  ): void {
    products.forEach((product) => {
      if (product.id) primaryIds.add(product.id);
      if (product.c_productDlcBaseString) relatedIds.add(product.c_productDlcBaseString);
      if (product.master.master_id) relatedIds.add(product.master.master_id);
      if (product.c_productOtherEditionsListString) {
        product.c_productOtherEditionsListString.forEach((id) => {
          relatedIds.add(id);
        });
      }
      if (product.variants) {
        product.variants.forEach((variant) => {
          relatedIds.add(variant.product_id);
        });
      }
    });
  }
}
