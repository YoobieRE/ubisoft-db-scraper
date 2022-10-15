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

  const configurationJsons: string[] = [];
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
          product?.configuration &&
          typeof product.configuration === 'object' &&
          Object.keys(product.configuration).length
        ) {
          configurationJsons.push(JSON.stringify(product.configuration));
        }
      });
    })
  );

  // Use quicktype to convert all the JSON strings to a Typescript interface
  const jsonInput = jsonInputForTargetLanguage('typescript');
  await jsonInput.addSource({
    name: 'configuration',
    samples: configurationJsons || [],
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
    path.join(__dirname, '../out/configuration-types.ts'),
    types.lines.join('\n'),
    'utf-8'
  );
};
main();
