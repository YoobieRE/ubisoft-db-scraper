import { game_configuration, ownership_service } from 'ubisoft-demux';
import yaml from 'yaml';
import deepEqual from 'fast-deep-equal';
import pRetry from 'p-retry';
import { Logger } from 'pino';
import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { Product, ProductDocument } from '../schema/product';
import { ProductRevision } from '../schema/product-revision';
import { chunkArray } from '../common/util';
import { OwnershipUnit } from './pool';
import { ManifestVersion } from '../schema/manifest-version';

export type DbScraperEvents = {
  configUpdate: (newProduct: ProductDocument, oldProduct?: ProductDocument) => void;
};

export interface DbScraperProps {
  ownershipPool: OwnershipUnit[];
  logger: Logger;
  maxProductId?: number;
  productIdChunkSize?: number;
  maxRetries?: number;
}

export default class DbScraper extends (EventEmitter as new () => TypedEmitter<DbScraperEvents>) {
  private ownershipPool: OwnershipUnit[];

  private maxProductId = 10000;

  private productIdChunkSize = 1000;

  private L: Logger;

  private retryOptions: pRetry.Options;

  constructor(props: DbScraperProps) {
    super();
    this.ownershipPool = props.ownershipPool;
    this.maxProductId = props.maxProductId ?? this.maxProductId;
    this.productIdChunkSize = props.productIdChunkSize ?? this.productIdChunkSize;
    this.L = props.logger;
    this.retryOptions = {
      retries: props.maxRetries ?? 5,
      onFailedAttempt: (err) => this.L.debug(err),
    };
  }

  public async scrapeManifests(): Promise<void> {
    const productIds = [...Array(this.maxProductId).keys()];
    this.L.info(
      `Scraping manifests for product IDs ${productIds[0]}-${productIds[productIds.length - 1]}`
    );

    await Promise.all(
      chunkArray(productIds, this.productIdChunkSize).map(async (productIdsChunk, index) => {
        const accountIndex = index % this.ownershipPool.length;
        const { limiter, ownershipConnection } = this.ownershipPool[accountIndex];
        const firstProductId = productIdsChunk[0];
        const lastProductId = productIdsChunk[productIdsChunk.length - 1];

        try {
          const manifestResp = await pRetry(
            async () =>
              limiter.add(() => {
                this.L.info(
                  { accountIndex },
                  `Getting manifests and current products for chunk ${firstProductId}-${lastProductId}`
                );
                return ownershipConnection.request({
                  request: {
                    requestId: 1,
                    deprecatedGetLatestManifestsReq: {
                      deprecatedTestConfig: false,
                      deprecatedProductIds: productIdsChunk,
                    },
                  },
                });
              }),
            this.retryOptions
          );
          const currentProducts = await Product.find({
            _id: { $gte: firstProductId, $lte: lastProductId },
          });
          const newManifests =
            manifestResp.response?.deprecatedGetLatestManifestsRsp?.manifests || [];
          this.L.debug(
            `Received ${newManifests.length} new manifests and ${currentProducts.length} current products`
          );
          const currentProductsMap = new Map(
            currentProducts.map((product) => [product._id, product])
          );

          // TODO: updateManifestHistory function
          await Promise.all(
            newManifests.map(async (newManifest) => {
              if (
                newManifest.result !==
                ownership_service.DeprecatedGetLatestManifestsRsp_Manifest_Result.Result_Success
              ) {
                // I couldn't find any non-success manifest results that had a configuration, so they're not worth storing
                // If they do get a successful result in the future, they will be picked up
                this.L.trace(
                  { productId: newManifest.productId, result: newManifest.result },
                  'Product ID does not exist'
                );
                return;
              }

              let currentProduct = currentProductsMap.get(newManifest.productId);
              if (!currentProduct || currentProduct.manifest !== newManifest.manifest) {
                currentProduct = await this.updateProduct(
                  newManifest.productId,
                  currentProduct,
                  newManifest.manifest
                );
              }

              // After we have the latest config in the product, we can use its digital
              // distribution version to update the manifest version.
              const manifestVersionExists = await ManifestVersion.exists({
                manifest: newManifest.manifest,
                productId: newManifest.productId,
              });
              if (!manifestVersionExists) {
                this.L.debug('Manifest does not exist');
                const digitalDistributionVersion =
                  typeof currentProduct?.configuration === 'object'
                    ? currentProduct?.configuration?.root?.digital_distribution?.version
                    : undefined;

                const newManifestVersion = new ManifestVersion({
                  productId: newManifest.productId,
                  manifest: newManifest.manifest,
                  releaseDate: new Date(),
                  digitalDistributionVersion,
                });
                this.L.info(
                  {
                    productId: newManifestVersion.productId,
                    manifest: newManifestVersion.manifest,
                    digitalDistributionVersion: newManifestVersion.digitalDistributionVersion,
                  },
                  'Inserting new manifest version'
                );
                await newManifestVersion.save();
              } else {
                this.L.trace('Manifest version already exists');
              }
            })
          );
        } catch (err) {
          this.L.error(err);
        }
      })
    );
  }

  // eslint-disable-next-line consistent-return
  public async updateProduct(
    productId: number,
    currentProduct?: ProductDocument | null,
    newManifest?: string
  ): Promise<ProductDocument | undefined> {
    const accountIndex = productId % this.ownershipPool.length;
    const { limiter, ownershipConnection } = this.ownershipPool[accountIndex];
    try {
      const configResp = await pRetry(
        async () =>
          limiter.add(() => {
            if (productId % 50 === 0) {
              this.L.debug(
                { productId, newManifest, accountIndex },
                'Getting latest product config'
              );
            }
            this.L.trace({ productId, newManifest, accountIndex }, 'Getting latest product config');
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
        newManifest === undefined
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
          manifest: newManifest,
          configuration: configParsed,
        });
        this.L.trace({ newProduct }, 'inserting new product');
        await newProduct.save();
        this.emit('configUpdate', newProduct);
        return newProduct;
      }

      if (
        (newManifest !== undefined && currentProduct.manifest !== newManifest) ||
        !deepEqual(currentProduct.configuration, configParsed)
      ) {
        // If there is a change in the document
        this.L.info({ productId }, 'A change was detected. Updating the product');
        // Save the old document
        const oldProduct = await ProductRevision.create({
          ...currentProduct.toObject(),
          _id: undefined,
        });
        // Don't overwrite existing manifest with undefined
        if (newManifest !== undefined) currentProduct.set({ manifest: newManifest });
        currentProduct.set({ configuration: configParsed });
        // Update the document
        await currentProduct.save();
        this.emit('configUpdate', currentProduct, oldProduct);
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
