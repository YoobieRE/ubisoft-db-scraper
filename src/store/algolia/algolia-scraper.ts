import deepEqual from 'fast-deep-equal';
import { Logger } from 'pino';
import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { AlgoliaIndexName, IAlgoliaProductItem } from './algolia-types';
import { AlgoliaApi } from './algolia-api';
import {
  AlgoliaProduct,
  AlgoliaProductDocument,
  IAlgoliaProduct,
} from '../../schema/algolia-product';
import { AlgoliaProductRevision } from '../../schema/algolia-product-revision';

export const productObjectIndexNames: AlgoliaIndexName[] = [
  ' ca_best_sellers_noRerank',
  'anz_custom_MFE',
  'at_custom_MFE',
  'br_custom_MFE',
  'ca_custom_MFE',
  'cn_custom_MFE',
  'de_custom_MFE',
  'es_custom_MFE',
  'eu_custom_MFE',
  'fr_custom_MFE',
  'fr_web_release_date',
  'ie_custom_MFE',
  'it_custom_MFE',
  'jp_custom_MFE',
  'kr_custom_MFE',
  'merlin_test',
  'nl_custom_MFE',
  'null',
  'preprod_test',
  'ru_custom_MFE',
  'sandbox_ca_title_alphabetically',
  'sea_custom_MFE',
  'test_release_date',
  'test_release_date_260',
  'test_yuriy_index',
  'test_yuriy_index2',
  'tr_custom_MFE',
  'uat_fr_release_date',
  'uk_custom_MFE',
  'us_best_seller_AI',
  'us_custom_MFE',
];

export interface AlgoliaProductScraperProps {
  logger: Logger;
}

export interface AlgoliaDbChangeSet {
  product: AlgoliaProductDocument;
  revision?: AlgoliaProductDocument;
}

export type AlgoliaScraperEvents = {
  algoliaProductAdded: (newProduct: IAlgoliaProduct) => void;
  algoliaProductUpdated: (newProduct: IAlgoliaProduct, oldProduct: IAlgoliaProduct) => void;
};

export class AlgoliaProductScraper extends (EventEmitter as new () => TypedEmitter<AlgoliaScraperEvents>) {
  private algolia = new AlgoliaApi();

  private L: Logger;

  constructor(props: AlgoliaProductScraperProps) {
    super();
    this.L = props.logger;
  }

  public async scrape(indexNames = productObjectIndexNames): Promise<Set<string>> {
    const updatedIds = await Promise.all(
      indexNames.map(async (indexName) =>
        // TODO: add limiter here?
        this.fetchAndUpdateIndexData(indexName)
      )
    );
    const updatedIdsSet = new Set<string>();
    updatedIds.flat().forEach((id) => {
      updatedIdsSet.add(id);
    });
    return updatedIdsSet;
  }

  private async fetchAndUpdateIndexData(indexName: AlgoliaIndexName): Promise<string[]> {
    try {
      const [indexProducts, currentProducts] = await Promise.all([
        this.algolia.fetchAllIndexObjects<IAlgoliaProductItem>(indexName),
        AlgoliaProduct.find({ indexName }, { 'product._id': 0 }), // Exclude _id to not mess up comparison
      ]);
      const currentProductMap = new Map<string, IAlgoliaProductItem>();
      currentProducts.forEach((currentProduct) => {
        currentProductMap.set(currentProduct.product.id, currentProduct.toObject().product);
      });

      const productUpdatesChangeSets = indexProducts
        .map((indexProduct) =>
          this.compareAndCreateChangeSet(indexName, currentProductMap, indexProduct)
        )
        .filter((p): p is AlgoliaDbChangeSet => p !== null);

      const newProducts = productUpdatesChangeSets.map((c) => c.product);
      const newRevisions = productUpdatesChangeSets
        .map((c) => c.revision)
        .filter((c): c is AlgoliaProductDocument => c !== undefined);
      await Promise.all([
        AlgoliaProduct.insertMany(newProducts),
        AlgoliaProductRevision.insertMany(newRevisions),
      ]);
      const updatedProductIds = productUpdatesChangeSets.map((c) => c.product.product.id);
      return updatedProductIds;
    } catch (err) {
      this.L.error({ indexName, err });
      return [];
    }
  }

  private compareAndCreateChangeSet(
    indexName: AlgoliaIndexName,
    currentProductMap: Map<string, IAlgoliaProductItem>,
    indexProduct: IAlgoliaProductItem
  ): AlgoliaDbChangeSet | null {
    const currentProduct = currentProductMap.get(indexProduct.id);
    if (currentProduct) currentProductMap.delete(indexProduct.id);
    if (currentProduct && deepEqual(currentProduct, indexProduct)) return null;

    this.L.debug({ id: indexProduct.id, indexName }, 'New Algolia product or change detected');
    try {
      const changeSet: AlgoliaDbChangeSet = {
        product: new AlgoliaProduct({
          indexName,
          product: indexProduct,
        }),
      };
      if (currentProduct) {
        changeSet.revision = new AlgoliaProductRevision({
          indexName,
          product: currentProduct,
          createdAt: undefined,
          updatedAt: undefined,
        });
        this.emit(
          'algoliaProductUpdated',
          changeSet.product.toObject(),
          changeSet.revision.toObject()
        );
      } else {
        this.emit('algoliaProductAdded', changeSet.product.toObject());
      }
      return changeSet;
    } catch (err) {
      this.L.error({ indexName, id: indexProduct.id, err });
      return null;
    }
  }
}
