import { game_configuration, ownership_service } from 'ubisoft-demux';
import yaml from 'yaml';
import { Document } from 'mongoose';
import deepEqual from 'fast-deep-equal';
import { Logger } from 'pino';
import { IProduct, Product } from '../schema/product';
import { ProductRevision } from '../schema/product-revision';
import { chunkArray } from '../common/util';
import { OwnershipUnit } from './pool';

export interface DbScraperProps {
  ownershipPool: OwnershipUnit[];
  logger: Logger;
  maxProductId?: number;
  productIdChunkSize?: number;
}

export default class DbScraper {
  private ownershipPool: OwnershipUnit[];

  private maxProductId = 10000;

  private productIdChunkSize = 1000;

  private L: Logger;

  constructor(props: DbScraperProps) {
    this.ownershipPool = props.ownershipPool;
    this.maxProductId = props.maxProductId ?? this.maxProductId;
    this.productIdChunkSize = props.productIdChunkSize ?? this.productIdChunkSize;
    this.L = props.logger;
  }

  public async scrapeManifests(): Promise<void> {
    const productIds = [...Array(this.maxProductId).keys()];
    this.L.info(
      `Scraping manifests for product IDs ${productIds[0]}-${productIds[productIds.length - 1]}`
    );

    await Promise.all(
      chunkArray(productIds, this.productIdChunkSize).map((productIdsChunk, index) => {
        const { limiter, ownershipConnection } =
          this.ownershipPool[index % this.ownershipPool.length];
        return limiter.schedule(async () => {
          const firstProductId = productIdsChunk[0];
          const lastProductId = productIdsChunk[productIdsChunk.length - 1];
          this.L.info(
            `Getting manifests and current products for chunk ${firstProductId}-${lastProductId}`
          );
          const [manifestResp, currentProducts] = await Promise.all([
            ownershipConnection.request({
              request: {
                requestId: 1,
                deprecatedGetLatestManifestsReq: {
                  deprecatedTestConfig: false,
                  deprecatedProductIds: productIdsChunk,
                },
              },
            }),
            Product.find({
              _id: { $gte: firstProductId, $lte: lastProductId },
            }),
          ]);
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

              const currentProduct = currentProductsMap.get(newManifest.productId);
              if (!currentProduct || currentProduct.manifest !== newManifest.manifest) {
                await this.updateProduct(
                  newManifest.productId,
                  currentProduct,
                  newManifest.manifest
                );
              }
            })
          );
        });
      })
    );
  }

  public async updateProduct(
    productId: number,
    currentProduct?: (Document<unknown, unknown, IProduct> & IProduct) | null,
    newManifest?: string
  ): Promise<void> {
    if (productId % 50 === 0) {
      this.L.debug({ productId, newManifest }, 'Getting latest product config');
    }
    this.L.trace({ productId, newManifest }, 'Getting latest product config');
    const { limiter, ownershipConnection } =
      this.ownershipPool[productId % this.ownershipPool.length];
    return limiter.schedule(async () => {
      try {
        this.L.trace({ productId }, 'Getting new config');
        const configResp = await ownershipConnection.request({
          request: {
            requestId: 1,
            getProductConfigReq: {
              deprecatedTestConfig: false,
              productId,
            },
          },
        });
        const configuration = configResp.response?.getProductConfigRsp?.configuration;
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
          return;
        }

        if (
          (newManifest !== undefined && currentProduct.manifest !== newManifest) ||
          !deepEqual(currentProduct.configuration, configParsed)
        ) {
          // If there is a change in the document
          this.L.info({ productId }, 'A change was detected. Updating the product');
          await ProductRevision.create({ ...currentProduct.toObject(), _id: undefined }); // Save the old document
          // Update the old document
          await currentProduct.updateOne({
            manifest: newManifest, // undefined does not unset property in MongoDB
            configuration: configParsed,
          });
        }
      } catch (err) {
        this.L.warn(err);
      }
    });
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
        this.L.info(`Getting current products for chunk ${firstProductId}-${lastProductId}`);
        const currentProducts = await Product.find({
          _id: { $gte: firstProductId, $lte: lastProductId },
        });
        const currentProductsMap = new Map(
          currentProducts.map((product) => [product._id, product])
        );
        await Promise.all(
          productIds.map(async (productId) => {
            const currentProduct = currentProductsMap.get(productId);
            await this.updateProduct(productId, currentProduct);
          })
        );
      })
    );
  }
}
