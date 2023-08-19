/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { outputJSONSync } from 'fs-extra';
import { CurrencyCode, SiteID, locales, StoreFaultResponse, ShopLocale } from './shop-types';
import { ShopApi } from './shop/shop-api';

const allRegions: SiteID[] = [
  // 'anz_ubisoft',
  // 'at_ubisoft',
  // 'br_ubisoft',
  // 'ca_ubisoft',
  // 'cn_ubisoft',
  // 'de_ubisoft',
  // 'es_ubisoft',
  // 'eu_ubisoft',
  // 'fr_ubisoft',
  // 'ie_ubisoft',
  // 'it_ubisoft',
  // 'jp_ubisoft',
  // 'kr_ubisoft',
  // 'nl_ubisoft',
  // 'ru_ubisoft',
  // 'sea_ubisoft',
  // 'tr_ubisoft',
  // 'uk_ubisoft',
  // 'us_ubisoft',
  // 'anz_uplaypc',
  // 'at_uplaypc',
  // 'br_uplaypc',
  // 'ca_uplaypc',
  // 'cn_uplaypc',
  // 'de_uplaypc',
  // 'es_uplaypc',
  // 'eu_uplaypc',
  // 'fr_uplaypc',
  // 'ie_uplaypc',
  // 'it_uplaypc',
  // 'jp_uplaypc',
  // 'kr_uplaypc',
  // 'nl_uplaypc',
  // 'ru_uplaypc',
  // 'sea_uplaypc',
  // 'tr_uplaypc',
  // 'uk_uplaypc',
  // 'us_uplaypc',
  // 'ca_south_park',
  // 'us_south_park',
  'performance-tracker',
];

const allCurrencies: CurrencyCode[] = [
  'ARS',
  'AUD',
  'BRL',
  'CAD',
  'CLP',
  'CNY',
  'COP',
  'CRC',
  'CZK',
  'DKK',
  'EUR',
  'GBP',
  'HKD',
  'HUF',
  'IDR',
  'JPY',
  'KRW',
  'MXN',
  'MYR',
  'NOK',
  'NZD',
  'PEN',
  'PHP',
  'PLN',
  'RUB',
  'SEK',
  'SGD',
  'THB',
  'TRY',
  'TWD',
  'USD',
  'UYU',
];

const main = async () => {
  // for (let year = 17; year <= 22; year += 1) {
  //   for (let month = 0; month <= 16; month += 1) {
  //     try {
  //       // eslint-disable-next-line no-await-in-loop
  //       const resp = await phin({
  //         method: 'GET',
  //         url: `https://store.ubi.com/s/us_ubisoft/dw/shop/v${year}_${month}/products/57062ebf88a7e316728b460e?expand&currency=USD&client_id=2a3b13e8-a80b-4795-853a-4cd52645919b&locale=en-US`,
  //         parse: 'json',
  //       });
  //       if (resp.statusCode === 200) {
  //         console.log(`Working version: v${year.toFixed(0)}_${month.toFixed(0)}`);
  //       }
  //     } catch (err) {
  //       // no nothing
  //     }
  //   }
  // }

  const shop = new ShopApi({ locale: undefined });
  const supportedLocales: Record<string, ShopLocale[]> = {};

  // for (const currency of allCurrencies) {
  for (const locale of locales) {
    // const countryCodes = ShopApi.getCountriesByCurrency(currency);
    // for (const countryCode of countryCodes) {
    //   const regions = allRegions.filter((r) => r.startsWith(countryCode));
    for (const region of allRegions) {
      let localeList = supportedLocales[region];
      if (!localeList) localeList = [];
      try {
        const filename = `${region}-${locale}`;
        console.log(`doing ${filename}`);
        const body = await shop.getProduct('616edb950d253c42d49fa64e', {
          locale,
          siteId: region,
          currency: undefined,
        });
        supportedLocales[region] = [...localeList, locale];
        console.log(body);
        outputJSONSync(`./locale-dumps/locales.json`, supportedLocales, {
          spaces: 2,
        });
        // outputJSONSync(`./store-dumps/${filename}`, body, {
        //   spaces: 2,
        // });
      } catch (err) {
        // if (err?.type !== 'UnsupportedLocaleException') {
        console.error(err);
        // }
      }
    }
  }
  // }
};

main();
