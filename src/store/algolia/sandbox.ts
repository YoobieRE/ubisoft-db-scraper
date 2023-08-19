import { outputJSONSync } from 'fs-extra';
import mongoose from 'mongoose';
import { config } from '../../common/config';
// import logger from '../../common/logger';
import { AlgoliaProduct } from '../../schema/algolia-product';
// import { AlgoliaProductScraper } from './algolia-scraper';

async function main() {
  const mongooseConnection = await mongoose.connect(config.dbConnectionString, {
    autoIndex: false,
  });

  try {
    // const scraper = new AlgoliaProductScraper({ logger });
    // await scraper.scrape();
    const allProducts = await AlgoliaProduct.find({
      indexName: 'us_custom_MFE',
    });
    const subBrands = new Set<string>();
    allProducts.forEach((p) => {
      if (p.product.sub_brand && p.product.brand === 'Ubisoft') subBrands.add(p.product.sub_brand);
    });
    outputJSONSync('sub-brands.json', Array.from(subBrands).sort(), { spaces: 2 });
  } catch (err) {
    console.error(err);
  }
  await mongooseConnection.disconnect();
}

main();
