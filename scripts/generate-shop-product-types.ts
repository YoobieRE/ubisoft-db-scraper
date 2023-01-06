/* eslint-disable no-await-in-loop */
import { InputData, jsonInputForTargetLanguage, quicktype } from 'quicktype-core';
import mongoose from 'mongoose';
import { writeFileSync } from 'fs-extra';
import path from 'path';
import { config } from '../src/common/config';
import { ShopProduct } from '../src/schema/shop-product';

const main = async () => {
  const mongooseConnection = await mongoose.connect(config.dbConnectionString, {
    autoIndex: false,
  });

  const productJSONs: string[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for await (const product of ShopProduct.find()) {
    productJSONs.push(JSON.stringify(product));
  }

  // Use quicktype to convert all the JSON strings to a Typescript interface
  const jsonInput = jsonInputForTargetLanguage('typescript');
  await jsonInput.addSource({
    name: 'ShopProductPage',
    samples: productJSONs || [],
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
    path.join(__dirname, '../out/shop-product-configuration-types.ts'),
    types.lines.join('\n'),
    'utf-8'
  );
};
main();
