/* eslint-disable no-await-in-loop */
import { InputData, jsonInputForTargetLanguage, quicktype } from 'quicktype-core';
import mongoose from 'mongoose';
import { writeFileSync } from 'fs-extra';
import path from 'path';
import { config } from '../src/common/config';
import { AlgoliaProduct } from '../src/schema/algolia-product';

const main = async () => {
  const mongooseConnection = await mongoose.connect(config.dbConnectionString, {
    autoIndex: false,
  });

  const productJSONs: string[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for await (const product of AlgoliaProduct.find({}, { 'product._id': 0 })) {
    productJSONs.push(JSON.stringify(product.product));
  }

  // Use quicktype to convert all the JSON strings to a Typescript interface
  const jsonInput = jsonInputForTargetLanguage('typescript');
  await jsonInput.addSource({
    name: 'IAlgoliaProductItem',
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
    path.join(__dirname, '../out/algolia-product-types.ts'),
    types.lines.join('\n'),
    'utf-8'
  );
};
main();
