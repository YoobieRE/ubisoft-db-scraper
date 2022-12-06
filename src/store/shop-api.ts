/* eslint-disable class-methods-use-this */
import phin from 'phin';
import * as shop from './shop-types';

export interface ShopApiProps {
  origin?: string;
  region?: shop.StoreRegion;
  version?: shop.StoreVersion;
  currency?: shop.StoreCurrency;
  clientId?: string;
  locale?: shop.ShopLocale;
}

export interface ProductsProps extends ShopApiProps {
  sections?: shop.DataSection[];
}

export class ShopApi {
  // https://store-dev.ubi.com - out of date config, not useful
  // https://store-staging.ubi.com - likely where config changes are prepared
  public origin = 'https://store.ubi.com';

  public version: shop.StoreVersion = 'v22_10';

  public region: shop.StoreRegion = 'us_ubisoft';

  public currency: shop.StoreCurrency = 'USD';

  public locale: shop.ShopLocale = 'en-US';

  public clientId = '2a3b13e8-a80b-4795-853a-4cd52645919b';

  public sections: shop.DataSection[] = [
    'images',
    'variations',
    'prices',
    'promotions',
    'availability',
  ];

  constructor(props?: ShopApiProps) {
    this.origin = props?.origin ?? this.origin;
    this.version = props?.version ?? this.version;
    this.region = props?.region ?? this.region;
    this.currency = props?.currency ?? this.currency;
    this.clientId = props?.clientId ?? this.clientId;
    this.locale = props?.locale ?? this.locale;
  }

  /**
   * Get a batch of store product info
   * @param productIds a list of up to 40 store product IDS (e.g. 57062ebf88a7e316728b460e)
   * @param overrides an optional set of options to override from the constructed defaults
   * @returns the raw response from the API call
   */
  public async getProducts(
    productIds: string[],
    overrides?: ProductsProps
  ): Promise<shop.ProductsResponseBody> {
    /**
     * For earlier versions like v19_8, there is a recommended limit of 40, with a hard limit higher due to response body size limits
     * For latest versions like v22_10, the API caps the limit to 24
     */
    const PRODUCTS_LIMIT = 24;

    if (productIds.length > PRODUCTS_LIMIT) {
      throw new Error(
        `${productIds.length} products were provided, which is greater than the allowed maximum of ${PRODUCTS_LIMIT}`
      );
    }
    const productUrl = new URL(
      `${overrides?.origin || this.origin}/s/${overrides?.region || this.region}/dw/shop/${
        overrides?.version || this.version
      }/products/(${productIds.join(',')})`
    );
    this.applySearchParams(productUrl, overrides);

    const resp = await phin<shop.ProductsResponseBody>({
      method: 'GET',
      url: productUrl,
      parse: 'json',
    });

    this.handleError(resp);

    return resp.body;
  }

  /**
   * Get one product's info
   * @param productId a store product IDS (e.g. 57062ebf88a7e316728b460e)
   * @param overrides an optional set of options to override from the constructed defaults
   * @returns the raw response from the API call
   */
  public async getProduct(productId: string, overrides?: ProductsProps): Promise<shop.Product> {
    const productUrl = new URL(
      `${overrides?.origin || this.origin}/s/${overrides?.region || this.region}/dw/shop/${
        overrides?.version || this.version
      }/products/${productId}`
    );
    this.applySearchParams(productUrl, overrides);

    const resp = await phin<shop.Product>({
      method: 'GET',
      url: productUrl,
      parse: 'json',
    });

    this.handleError(resp);

    return resp.body;
  }

  private applySearchParams(url: URL, overrides?: ProductsProps): URL {
    url.searchParams.append('expand', (overrides?.sections || this.sections).join(','));
    url.searchParams.append('currency', overrides?.currency || this.currency);
    url.searchParams.append('client_id', overrides?.clientId || this.clientId);
    url.searchParams.append('locale', overrides?.locale || this.locale);
    return url;
  }

  private handleError(resp: phin.IJSONResponse<unknown>): void {
    if (resp.statusCode === 400) {
      const body = resp.body as shop.ShopFaultResponse;
      const err = new Error();
      Object.assign(err, body.fault);
      throw err;
    }
  }

  public getCountriesByCurrency(currency: shop.StoreCurrency): shop.CountryCode[] {
    return shop.currencyCountryMap[currency];
  }

  public getCurrenciesByCountry(country: shop.CountryCode): shop.StoreCurrency[] {
    return Object.entries(shop.currencyCountryMap)
      .filter(([, countries]) => countries.includes(country))
      .map(([currency]) => currency as shop.StoreCurrency);
  }
}
