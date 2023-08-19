import { outputJSONSync } from 'fs-extra';
import { diffString } from 'json-diff';
import mongoose from 'mongoose';
import { config } from '../../common/config';
import logger from '../../common/logger';
import { AlgoliaProduct } from '../../schema/algolia-product';
import { Product } from '../../schema/product';
import { ShopProduct } from '../../schema/shop-product';
import { ShopProductScraper } from './shop-scraper';

async function main() {
  const mongooseConnection = await mongoose.connect(config.dbConnectionString, {
    autoIndex: false,
  });

  console.log(`matching products`);

  const matchedProducts = await Product.find({
    $or: [
      { 'storeProduct.upsell.storeReference': { $regex: /^[0-9a-f]+$/ } },
      { 'storeProduct.ingame.storeReference': { $regex: /^[0-9a-f]+$/ } },
    ],
  });
  console.log(`matched ${matchedProducts.length} products`);
  const ids = new Set<string>();
  matchedProducts.forEach((product) => {
    if (product.storeProduct?.ingame?.storeReference) {
      ids.add(product.storeProduct?.ingame?.storeReference);
    }
    if (product.storeProduct?.upsell?.storeReference) {
      ids.add(product.storeProduct?.upsell?.storeReference);
    }
  });
  console.log(`found ${ids.size} ids from database`);

  const algoliaDocs = await AlgoliaProduct.find({}, { product: { id: 1, MasterID: 1 } });

  algoliaDocs.forEach((doc) => {
    if (doc.product.id) ids.add(doc.product.id);
    if (doc.product.MasterID) ids.add(doc.product.MasterID);
  });

  console.log(`found ${ids.size} total ids after algolia`);

  const shopDocs = await ShopProduct.find(
    {},
    {
      product: {
        c_productDlcBaseString: 1,
        c_productOtherEditionsListString: 1,
        'master.master_id': 1,
        'variants.product_id': 1,
      },
    }
  );

  shopDocs.forEach((doc) => {
    if (doc.product.id) ids.add(doc.product.id);
    if (doc.product.c_productDlcBaseString) ids.add(doc.product.c_productDlcBaseString);
    if (doc.product.master.master_id) ids.add(doc.product.master.master_id);
    if (doc.product.variants) {
      doc.product.variants.forEach((variant) => {
        ids.add(variant.product_id);
      });
    }
  });

  console.log(`found ${ids.size} total ids after shop`);
  outputJSONSync('store-ids.json', Array.from(ids).sort(), { spaces: 2 });

  const scraper = new ShopProductScraper({ logger });

  scraper.on('shopProductUpdated', (newProduct, oldProduct) => {
    logger.debug(diffString(oldProduct, newProduct));
  });

  await scraper.scrape(ids);

  await mongooseConnection.disconnect();
}

main();
