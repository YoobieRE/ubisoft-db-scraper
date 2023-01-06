/* eslint-disable class-methods-use-this */
import phin from 'phin';
import PQueue from 'p-queue';
import * as shop from './shop-types';

export interface ShopApiProps {
  origin?: string;
  siteId?: shop.SiteID;
  version?: shop.StoreVersion;
  currency?: shop.CurrencyCode;
  clientId?: string;
  locale?: shop.ShopLocale;
}

export interface ProductsProps extends ShopApiProps {
  parameters?: shop.ProductParameter[];
}

export class ShopApi {
  // https://store-dev.ubi.com - out of date config, not useful
  // https://store-staging.ubi.com - likely where config changes are prepared
  public origin = 'https://store.ubi.com';

  public version: shop.StoreVersion = 'v22_10';

  public siteId: shop.SiteID = 'us_ubisoft';

  public currency?: shop.CurrencyCode = 'USD';

  public locale?: shop.ShopLocale = 'en-US';

  public clientId = '2a3b13e8-a80b-4795-853a-4cd52645919b';

  public limiter: PQueue = new PQueue({ concurrency: 10, interval: 0 });

  private timeout = 5000;

  public parameters: shop.ProductParameter[] = [
    'images',
    'variations',
    'prices',
    'promotions',
    'availability',
  ];

  constructor(props?: ShopApiProps) {
    if (!props) return;
    this.origin = props.origin ?? this.origin;
    this.version = props.version ?? this.version;
    this.siteId = props.siteId ?? this.siteId;
    this.clientId = props.clientId ?? this.clientId;
    // Allow these props to be undefined
    if ('currency' in props) this.currency = props.currency;
    if ('locale' in props) this.locale = props.locale;
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
  ): Promise<shop.ProductResult> {
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
      `${overrides?.origin || this.origin}/s/${overrides?.siteId || this.siteId}/dw/shop/${
        overrides?.version || this.version
      }/products/(${productIds.join(',')})`
    );
    this.applySearchParams(productUrl, overrides);

    const resp = await this.limiter.add(() =>
      phin({
        method: 'GET',
        url: productUrl,
        timeout: this.timeout,
      })
    );

    const body = this.parseResponse<shop.ProductResult>(resp);

    this.handleError(resp, body);

    return body;
  }

  /**
   * Get one product's info
   * @param productId a store product IDS (e.g. 57062ebf88a7e316728b460e)
   * @param overrides an optional set of options to override from the constructed defaults
   * @returns the raw response from the API call
   */
  public async getProduct(productId: string, overrides?: ProductsProps): Promise<shop.Product> {
    const productUrl = new URL(
      `${overrides?.origin || this.origin}/s/${overrides?.siteId || this.siteId}/dw/shop/${
        overrides?.version || this.version
      }/products/${productId}`
    );
    this.applySearchParams(productUrl, overrides);

    const resp = await this.limiter.add(() =>
      phin({
        method: 'GET',
        url: productUrl,
        timeout: this.timeout,
      })
    );

    const body = this.parseResponse<shop.Product>(resp);

    this.handleError(resp, body);

    return body;
  }

  private applySearchParams(url: URL, overrides?: ProductsProps): URL {
    url.searchParams.append('expand', (overrides?.parameters || this.parameters).join(','));
    url.searchParams.append('client_id', overrides?.clientId || this.clientId);
    // Allow these props to be unset
    const currencyParam =
      overrides && 'currency' in overrides ? overrides?.currency : this.currency;
    if (currencyParam) {
      url.searchParams.append('currency', currencyParam);
    }
    const localeParam = overrides && 'locale' in overrides ? overrides?.locale : this.locale;
    if (localeParam) {
      url.searchParams.append('locale', localeParam);
    }
    return url;
  }

  private parseResponse<T>(resp: phin.IResponse): T {
    const bodyString = resp.body.toString();
    let body: T;
    try {
      body = JSON.parse(bodyString);
    } catch (err) {
      if (bodyString) throw new Error(`${resp.statusCode}: ${bodyString}`);
      throw err;
    }
    return body;
  }

  private handleError(resp: phin.IResponse, jsonBody: unknown): void {
    if (resp.statusCode === 200) return;
    const err = new Error(`Request responded with status code ${resp.statusCode}`);
    const body = jsonBody as shop.StoreFaultResponse;
    if (body) {
      if (resp.statusCode && resp.statusCode >= 400 && resp.statusCode <= 404) {
        Object.assign(err, body.fault);
      } else {
        Object.assign(err, body);
      }
    }
    throw err;
  }

  public static getCountriesByCurrency(currency: shop.CurrencyCode): shop.CountryCode[] {
    return shop.currencyCountryMap[currency];
  }

  public static getCurrenciesByCountry(country: shop.CountryCode): shop.CurrencyCode[] {
    return Object.entries(shop.currencyCountryMap)
      .filter(([, countries]) => countries.includes(country))
      .map(([currency]) => currency as shop.CurrencyCode);
  }

  public static getCurrenciesBySiteId(siteId: shop.SiteID): shop.CurrencyCode[] {
    if (siteId === 'performance-tracker') return ['EUR'];
    const countryCode = siteId.split('_')[0] as shop.CountryCode;
    if (!countryCode) return [];
    return ShopApi.getCurrenciesByCountry(countryCode);
  }
}
