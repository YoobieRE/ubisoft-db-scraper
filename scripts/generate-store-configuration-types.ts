import { InputData, jsonInputForTargetLanguage, quicktype } from 'quicktype-core';
import mongoose from 'mongoose';
import { writeFileSync } from 'fs-extra';
import path from 'path';
import { config } from '../src/common/config';
import { Product } from '../src/schema/product';
import { chunkArray } from '../src/common/util';

const main = async () => {
  const mongooseConnection = await mongoose.connect(config.dbConnectionString, {
    autoIndex: false,
  });

  const upsellConfigs: string[] = [];
  const ingameConfigs: string[] = [];
  const productIds = [...Array(config.maxProductId || 64000).keys()];
  await Promise.all(
    chunkArray(productIds, config.productIdChunkSize || 1000).map(async (productIdsChunk) => {
      const firstProductId = productIdsChunk[0];
      const lastProductId = productIdsChunk[productIdsChunk.length - 1];
      const currentProducts = await Product.find({
        _id: { $gte: firstProductId, $lte: lastProductId },
      });
      currentProducts.forEach((product) => {
        if (
          product?.storeProduct?.ingame?.configuration &&
          Object.keys(product.storeProduct.ingame.configuration).length
        ) {
          ingameConfigs.push(JSON.stringify(product.storeProduct.ingame.configuration));
        }
        if (
          product?.storeProduct?.upsell?.configuration &&
          Object.keys(product.storeProduct.upsell.configuration).length
        ) {
          upsellConfigs.push(JSON.stringify(product.storeProduct.upsell.configuration));
        }
      });
    })
  );

  // Use quicktype to convert all the JSON strings to a Typescript interface
  const jsonInput = jsonInputForTargetLanguage('typescript');
  await jsonInput.addSource({
    name: 'upsellStoreConfiguration',
    samples: upsellConfigs || [],
  });
  await jsonInput.addSource({
    name: 'ingameStoreConfiguration',
    samples: ingameConfigs || [],
  });

  const inputData = new InputData();
  inputData.addInput(jsonInput);

  const types = await quicktype({
    inputData,
    lang: 'typescript',
    rendererOptions: {
      'just-types': 'true',
    },
  });

  // Add ESLint exceptions
  types.lines.unshift('/* eslint-disable */');

  await mongooseConnection.disconnect();

  writeFileSync(
    path.join(__dirname, '../out/store-configuration-types.ts'),
    types.lines.join('\n'),
    'utf-8'
  );
};
main();
