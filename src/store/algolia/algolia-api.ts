/* eslint-disable no-await-in-loop */
/* eslint-disable class-methods-use-this */
import PQueue from 'p-queue';
import algoliasearch, { SearchClient } from 'algoliasearch';
import { IAlgoliaIndex } from '../../schema/algolia-indexes';

export interface AlgoliaApiProps {
  origin?: string;
  apiKey?: string;
  appId?: string;
  algoliaAgent?: string;
}

export class AlgoliaApi {
  public apiKey = '5638539fd9edb8f2c6b024b49ec375bd';

  public appId = 'XELY3U4LOD';

  private maxHitsPerPage = 1000;

  private maxBatchQueries = 80;

  public limiter: PQueue = new PQueue({ concurrency: this.maxBatchQueries });

  public client: SearchClient;

  constructor(props?: AlgoliaApiProps) {
    this.apiKey = props?.apiKey ?? this.apiKey;
    this.appId = props?.appId ?? this.appId;
    this.client = algoliasearch(this.appId, this.apiKey);
  }

  public async fetchAllIndexObjects<T = unknown>(indexName: string): Promise<T[]> {
    const index = this.client.initIndex(indexName);
    let pageLength = 0;
    let allObjects: T[] = [];
    let curentPage = 0;
    do {
      const page = curentPage;
      const resp = await this.limiter.add(() =>
        index.search<T>('', { page, hitsPerPage: this.maxHitsPerPage })
      );
      curentPage += 1;
      pageLength = resp.hits.length;
      allObjects = allObjects.concat(resp.hits);
    } while (pageLength > 0);
    return allObjects;
  }

  public async fetchIndexes(): Promise<IAlgoliaIndex[]> {
    const resp = await this.limiter.add(() => this.client.listIndices());
    return resp.items.map((item) => ({
      name: item.name,
      createdAt: new Date(item.createdAt),
    }));
  }
}
