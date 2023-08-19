/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { diff, diffString } from 'json-diff';
import { ShopApi } from './shop/shop-api';
import { chunkArray } from '../common/util';

const main = async () => {
  const shop = new ShopApi({ locale: undefined });

  const idChunks = chunkArray(Array.from(ids), 24);

  try {
    for (const idChunk of idChunks) {
      const prodResult = await shop.getProducts(idChunk);
      const prodProducts = prodResult.data;
      const stgResult = await shop.getProducts(idChunk, {
        // origin: 'https://store-staging.ubi.com',
        siteId: 'ca_uplaypc',
        currency: 'CAD',
        locale: 'en-CA',
      });
      const stgProducts = stgResult.data;
      console.log('got chunks');
      idChunk.forEach((id) => {
        const prodListing = prodProducts?.find((p) => p.id === id);
        const stgListing = stgProducts?.find((p) => p.id === id);
        if (!(prodListing && stgListing)) {
          return;
        }
        const verDiff = diff(prodListing, stgListing);
        if (verDiff) {
          console.log(`${id}: diff between prod and staging`);
          console.log(diffString(prodListing, stgListing));
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
};

main();
