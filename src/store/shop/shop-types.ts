// https://ecom-cdn.ubi.com/wallet/wallet-reward-claim-modal/app.js
export type CountryCode =
  | 'anz'
  | 'at'
  | 'br'
  | 'ca'
  | 'cn'
  | 'de'
  | 'es'
  | 'eu'
  | 'fr'
  | 'ie'
  | 'it'
  | 'jp'
  | 'kr'
  | 'nl'
  | 'ru'
  | 'sea'
  | 'tr'
  | 'uk'
  | 'us';

export type SiteID =
  | `${CountryCode}_ubisoft`
  | `${CountryCode}_uplaypc`
  | 'ca_south_park'
  | 'us_south_park'
  | 'performance-tracker';

export const siteIds: SiteID[] = [
  'anz_ubisoft',
  'anz_uplaypc',
  'at_ubisoft',
  'at_uplaypc',
  'br_ubisoft',
  'br_uplaypc',
  'ca_south_park',
  'ca_ubisoft',
  'ca_uplaypc',
  'cn_ubisoft',
  'cn_uplaypc',
  'de_ubisoft',
  'de_uplaypc',
  'es_ubisoft',
  'es_uplaypc',
  'eu_ubisoft',
  'eu_uplaypc',
  'fr_ubisoft',
  'fr_uplaypc',
  'ie_ubisoft',
  'ie_uplaypc',
  'it_ubisoft',
  'it_uplaypc',
  'jp_ubisoft',
  'jp_uplaypc',
  'kr_ubisoft',
  'kr_uplaypc',
  'nl_ubisoft',
  'nl_uplaypc',
  'performance-tracker',
  'ru_ubisoft',
  'ru_uplaypc',
  'sea_ubisoft',
  'sea_uplaypc',
  'tr_ubisoft',
  'tr_uplaypc',
  'uk_ubisoft',
  'uk_uplaypc',
  'us_south_park',
  'us_ubisoft',
  'us_uplaypc',
];

export const currencyCountryMap: Record<CurrencyCode, CountryCode[]> = {
  ARS: ['br'],
  AUD: ['anz'],
  BRL: ['br'],
  CAD: ['ca'],
  CLP: ['br'],
  CNY: ['cn'],
  COP: ['br'],
  CRC: ['br'],
  CZK: ['eu'],
  DKK: ['eu'],
  EUR: ['eu', 'ie', 'fr', 'de', 'es', 'at', 'it', 'nl'],
  GBP: ['uk'],
  HKD: ['sea'],
  HUF: ['eu'],
  IDR: ['sea'],
  JPY: ['jp'],
  KRW: ['kr'],
  MXN: ['br'],
  MYR: ['sea'],
  NOK: ['ie'],
  NZD: ['anz'],
  PEN: ['br'],
  PHP: ['sea'],
  PLN: ['eu'],
  RUB: ['ru'],
  SEK: ['eu'],
  SGD: ['sea'],
  THB: ['sea'],
  TRY: ['tr'],
  TWD: ['sea'],
  USD: ['br', 'ie', 'sea', 'us'],
  UYU: ['br'],
};

// https://ecom-cdn.ubi.com/wallet/wallet-reward-claim-modal/app.js
export type CurrencyCode =
  | 'ARS'
  | 'AUD'
  | 'BRL'
  | 'CAD'
  | 'CLP'
  | 'CNY'
  | 'COP'
  | 'CRC'
  | 'CZK'
  | 'DKK'
  | 'EUR'
  | 'GBP'
  | 'HKD'
  | 'HUF'
  | 'IDR'
  | 'JPY'
  | 'KRW'
  | 'MXN'
  | 'MYR'
  | 'NOK'
  | 'NZD'
  | 'PEN'
  | 'PHP'
  | 'PLN'
  | 'RUB'
  | 'SEK'
  | 'SGD'
  | 'THB'
  | 'TRY'
  | 'TWD'
  | 'USD'
  | 'UYU';

export const currencyCodes: CurrencyCode[] = [
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

// imports at bottom of https://ecom-cdn.ubi.com/wallet/wallet-header-balance/app.js
// Search for underscore locale, convert to dash, remove singulars, remove en-BR/es-BR
export type ShopLocale =
  | 'de-AT'
  | 'de-DE'
  | 'en-AU'
  | 'en-CA'
  | 'en-GB'
  | 'en-ID'
  | 'en-MY'
  | 'en-PH'
  | 'en-SG'
  | 'en-SK'
  | 'en-TR'
  | 'en-US'
  | 'en-ZW'
  | 'es-ES'
  | 'es-US'
  | 'fr-CA'
  | 'fr-FR'
  | 'ia-AG'
  | 'ia-AR'
  | 'ia-BB'
  | 'ia-BM'
  | 'ia-BO'
  | 'ia-BR'
  | 'ia-BS'
  | 'ia-BZ'
  | 'ia-CL'
  | 'ia-CO'
  | 'ia-CR'
  | 'ia-DM'
  | 'ia-DO'
  | 'ia-EC'
  | 'ia-GD'
  | 'ia-GT'
  | 'ia-GY'
  | 'ia-HN'
  | 'ia-HT'
  | 'ia-JM'
  | 'ia-KN'
  | 'ia-LC'
  | 'ia-MX'
  | 'ia-NI'
  | 'ia-PA'
  | 'ia-PE'
  | 'ia-PY'
  | 'ia-SR'
  | 'ia-SV'
  | 'ia-TT'
  | 'ia-UY'
  | 'ia-VC'
  | 'ia-VE'
  | 'it-IT'
  | 'ja-JP'
  | 'ko-KR'
  | 'la-AG'
  | 'la-AR'
  | 'la-BB'
  | 'la-BM'
  | 'la-BO'
  | 'la-BR'
  | 'la-BS'
  | 'la-BZ'
  | 'la-CL'
  | 'la-CO'
  | 'la-CR'
  | 'la-DM'
  | 'la-DO'
  | 'la-EC'
  | 'la-GD'
  | 'la-GT'
  | 'la-GY'
  | 'la-HN'
  | 'la-HT'
  | 'la-JM'
  | 'la-KN'
  | 'la-LC'
  | 'la-MX'
  | 'la-NI'
  | 'la-PA'
  | 'la-PE'
  | 'la-PY'
  | 'la-SR'
  | 'la-SV'
  | 'la-TT'
  | 'la-UY'
  | 'la-VC'
  | 'la-VE'
  | 'nl-NL'
  | 'pl-PL'
  | 'pt-AG'
  | 'pt-AR'
  | 'pt-BB'
  | 'pt-BM'
  | 'pt-BO'
  | 'pt-BR'
  | 'pt-BS'
  | 'pt-BZ'
  | 'pt-CL'
  | 'pt-CO'
  | 'pt-CR'
  | 'pt-DM'
  | 'pt-DO'
  | 'pt-EC'
  | 'pt-GD'
  | 'pt-GT'
  | 'pt-GY'
  | 'pt-HN'
  | 'pt-HT'
  | 'pt-JM'
  | 'pt-KN'
  | 'pt-LC'
  | 'pt-MX'
  | 'pt-NI'
  | 'pt-PA'
  | 'pt-PE'
  | 'pt-PY'
  | 'pt-SR'
  | 'pt-SV'
  | 'pt-TT'
  | 'pt-UY'
  | 'pt-VC'
  | 'pt-VE'
  | 'ru-RU'
  | 'th-TH'
  | 'zh-CN'
  | 'zh-HK'
  | 'zh-TW';

export const shopLocales: ShopLocale[] = [
  'de-AT',
  'de-DE',
  'en-AU',
  'en-CA',
  'en-GB',
  'en-ID',
  'en-MY',
  'en-PH',
  'en-SG',
  'en-SK',
  'en-TR',
  'en-US',
  'en-ZW',
  'es-ES',
  'es-US',
  'fr-CA',
  'fr-FR',
  'ia-AG',
  'ia-AR',
  'ia-BB',
  'ia-BM',
  'ia-BO',
  'ia-BR',
  'ia-BS',
  'ia-BZ',
  'ia-CL',
  'ia-CO',
  'ia-CR',
  'ia-DM',
  'ia-DO',
  'ia-EC',
  'ia-GD',
  'ia-GT',
  'ia-GY',
  'ia-HN',
  'ia-HT',
  'ia-JM',
  'ia-KN',
  'ia-LC',
  'ia-MX',
  'ia-NI',
  'ia-PA',
  'ia-PE',
  'ia-PY',
  'ia-SR',
  'ia-SV',
  'ia-TT',
  'ia-UY',
  'ia-VC',
  'ia-VE',
  'it-IT',
  'ja-JP',
  'ko-KR',
  'la-AG',
  'la-AR',
  'la-BB',
  'la-BM',
  'la-BO',
  'la-BR',
  'la-BS',
  'la-BZ',
  'la-CL',
  'la-CO',
  'la-CR',
  'la-DM',
  'la-DO',
  'la-EC',
  'la-GD',
  'la-GT',
  'la-GY',
  'la-HN',
  'la-HT',
  'la-JM',
  'la-KN',
  'la-LC',
  'la-MX',
  'la-NI',
  'la-PA',
  'la-PE',
  'la-PY',
  'la-SR',
  'la-SV',
  'la-TT',
  'la-UY',
  'la-VC',
  'la-VE',
  'nl-NL',
  'pl-PL',
  'pt-AG',
  'pt-AR',
  'pt-BB',
  'pt-BM',
  'pt-BO',
  'pt-BR',
  'pt-BS',
  'pt-BZ',
  'pt-CL',
  'pt-CO',
  'pt-CR',
  'pt-DM',
  'pt-DO',
  'pt-EC',
  'pt-GD',
  'pt-GT',
  'pt-GY',
  'pt-HN',
  'pt-HT',
  'pt-JM',
  'pt-KN',
  'pt-LC',
  'pt-MX',
  'pt-NI',
  'pt-PA',
  'pt-PE',
  'pt-PY',
  'pt-SR',
  'pt-SV',
  'pt-TT',
  'pt-UY',
  'pt-VC',
  'pt-VE',
  'ru-RU',
  'th-TH',
  'zh-CN',
  'zh-HK',
  'zh-TW',
];

export const regionLocaleMap: Record<SiteID, ShopLocale[]> = {
  anz_ubisoft: ['en-AU'],
  anz_uplaypc: ['en-AU'],
  at_ubisoft: ['de-AT'],
  at_uplaypc: ['de-AT'],
  br_ubisoft: [
    'ia-AG',
    'ia-AR',
    'ia-BB',
    'ia-BM',
    'ia-BO',
    'ia-BR',
    'ia-BS',
    'ia-BZ',
    'ia-CL',
    'ia-CO',
    'ia-CR',
    'ia-DM',
    'ia-DO',
    'ia-EC',
    'ia-GD',
    'ia-GT',
    'ia-GY',
    'ia-HN',
    'ia-HT',
    'ia-JM',
    'ia-KN',
    'ia-LC',
    'ia-MX',
    'ia-NI',
    'ia-PA',
    'ia-PE',
    'ia-PY',
    'ia-SR',
    'ia-SV',
    'ia-TT',
    'ia-UY',
    'ia-VC',
    'ia-VE',
    'la-AG',
    'la-AR',
    'la-BB',
    'la-BM',
    'la-BO',
    'la-BR',
    'la-BS',
    'la-BZ',
    'la-CL',
    'la-CO',
    'la-CR',
    'la-DM',
    'la-DO',
    'la-EC',
    'la-GD',
    'la-GT',
    'la-GY',
    'la-HN',
    'la-HT',
    'la-JM',
    'la-KN',
    'la-LC',
    'la-MX',
    'la-NI',
    'la-PA',
    'la-PE',
    'la-PY',
    'la-SR',
    'la-SV',
    'la-TT',
    'la-UY',
    'la-VC',
    'la-VE',
    'pt-AG',
    'pt-AR',
    'pt-BB',
    'pt-BM',
    'pt-BO',
    'pt-BR',
    'pt-BS',
    'pt-BZ',
    'pt-CL',
    'pt-CO',
    'pt-CR',
    'pt-DM',
    'pt-DO',
    'pt-EC',
    'pt-GD',
    'pt-GT',
    'pt-GY',
    'pt-HN',
    'pt-HT',
    'pt-JM',
    'pt-KN',
    'pt-LC',
    'pt-MX',
    'pt-NI',
    'pt-PA',
    'pt-PE',
    'pt-PY',
    'pt-SR',
    'pt-SV',
    'pt-TT',
    'pt-UY',
    'pt-VC',
    'pt-VE',
  ],
  br_uplaypc: [
    'ia-AG',
    'ia-AR',
    'ia-BB',
    'ia-BM',
    'ia-BO',
    'ia-BR',
    'ia-BS',
    'ia-BZ',
    'ia-CL',
    'ia-CO',
    'ia-CR',
    'ia-DM',
    'ia-DO',
    'ia-EC',
    'ia-GD',
    'ia-GT',
    'ia-GY',
    'ia-HN',
    'ia-HT',
    'ia-JM',
    'ia-KN',
    'ia-LC',
    'ia-MX',
    'ia-NI',
    'ia-PA',
    'ia-PE',
    'ia-PY',
    'ia-SR',
    'ia-SV',
    'ia-TT',
    'ia-UY',
    'ia-VC',
    'ia-VE',
    'la-AG',
    'la-AR',
    'la-BB',
    'la-BM',
    'la-BO',
    'la-BR',
    'la-BS',
    'la-BZ',
    'la-CL',
    'la-CO',
    'la-CR',
    'la-DM',
    'la-DO',
    'la-EC',
    'la-GD',
    'la-GT',
    'la-GY',
    'la-HN',
    'la-HT',
    'la-JM',
    'la-KN',
    'la-LC',
    'la-MX',
    'la-NI',
    'la-PA',
    'la-PE',
    'la-PY',
    'la-SR',
    'la-SV',
    'la-TT',
    'la-UY',
    'la-VC',
    'la-VE',
    'pt-AG',
    'pt-AR',
    'pt-BB',
    'pt-BM',
    'pt-BO',
    'pt-BR',
    'pt-BS',
    'pt-BZ',
    'pt-CL',
    'pt-CO',
    'pt-CR',
    'pt-DM',
    'pt-DO',
    'pt-EC',
    'pt-GD',
    'pt-GT',
    'pt-GY',
    'pt-HN',
    'pt-HT',
    'pt-JM',
    'pt-KN',
    'pt-LC',
    'pt-MX',
    'pt-NI',
    'pt-PA',
    'pt-PE',
    'pt-PY',
    'pt-SR',
    'pt-SV',
    'pt-TT',
    'pt-UY',
    'pt-VC',
    'pt-VE',
  ],
  ca_ubisoft: ['en-CA', 'fr-CA'],
  ca_uplaypc: ['en-CA', 'fr-CA'],
  ca_south_park: [],
  cn_ubisoft: ['zh-CN'],
  cn_uplaypc: ['zh-CN'],
  de_ubisoft: ['de-DE'],
  de_uplaypc: ['de-DE'],
  es_ubisoft: ['es-ES'],
  es_uplaypc: ['es-ES'],
  eu_ubisoft: ['en-SK', 'pl-PL'],
  eu_uplaypc: ['en-SK', 'pl-PL'],
  fr_ubisoft: ['fr-FR'],
  fr_uplaypc: ['fr-FR'],
  ie_ubisoft: ['en-ZW'],
  ie_uplaypc: ['en-ZW'],
  it_ubisoft: ['it-IT'],
  it_uplaypc: ['it-IT'],
  jp_ubisoft: ['ja-JP'],
  jp_uplaypc: ['ja-JP'],
  kr_ubisoft: ['ko-KR'],
  kr_uplaypc: ['ko-KR'],
  nl_ubisoft: ['nl-NL'],
  nl_uplaypc: ['nl-NL'],
  'performance-tracker': ['fr-FR'],
  ru_ubisoft: ['ru-RU'],
  ru_uplaypc: ['ru-RU'],
  sea_ubisoft: ['en-ID', 'en-MY', 'en-PH', 'en-SG', 'th-TH', 'zh-HK', 'zh-TW'],
  sea_uplaypc: ['en-ID', 'en-MY', 'en-PH', 'en-SG', 'th-TH', 'zh-HK', 'zh-TW'],
  tr_ubisoft: ['en-TR'],
  tr_uplaypc: ['en-TR'],
  uk_ubisoft: ['en-GB'],
  uk_uplaypc: ['en-GB'],
  us_ubisoft: ['en-US', 'es-US'],
  us_uplaypc: ['en-US', 'es-US'],
  us_south_park: ['en-US'],
};

export type ProductParameter = 'images' | 'variations' | 'prices' | 'promotions' | 'availability';

export type StoreVersion =
  | 'v17_1'
  | 'v17_2'
  | 'v17_3'
  | 'v17_4'
  | 'v17_6'
  | 'v17_7'
  | 'v17_8'
  | 'v18_1'
  | 'v18_2'
  | 'v18_3'
  | 'v18_6'
  | 'v18_7'
  | 'v18_8'
  | 'v19_1'
  | 'v19_3'
  | 'v19_5'
  | 'v19_8'
  | 'v19_10'
  | 'v20_2'
  | 'v20_3'
  | 'v20_4'
  | 'v20_8'
  | 'v20_9'
  | 'v20_10'
  | 'v21_2'
  | 'v21_3'
  | 'v21_6'
  | 'v21_8'
  | 'v21_9'
  | 'v21_10'
  | 'v22_4'
  | 'v22_6'
  | 'v22_8'
  | 'v22_10'
  | string;

export interface ProductResult {
  _v: StoreVersion;
  _type: 'product_result';
  count: number;
  data?: Product[];
  total: number;
}

export interface Product {
  id: string;
  /**
   * @diff currency
   */
  currency: CurrencyCode;
  _id: string;
  _type: 'product';
  brand?: string;
  image_groups: ImageGroup[];
  inventory: Inventory;
  long_description?: string;
  master: Master;
  min_order_quantity: number;
  name: string;
  /**
   * @diff region
   */
  page_title?: string;
  /**
   * @diff currency, region
   */
  price?: number;
  /**
   * @diff currency, region
   */
  price_per_unit?: number;
  /**
   * @diff region
   */
  primary_category_id?: string;
  /**
   * @diff region
   */
  product_promotions?: ProductPromotion[];
  step_quantity: number;
  type: ProductType;
  unit_measure?: string;
  unit_quantity?: number;
  variants?: Variant[];
  variation_attributes: VariationAttribute[];
  variation_values?: VariationValues;
  c_digitalItemNature?: CDigitalItemNature;
  c_dlcContentText?: string;
  c_dlcType?: CDlcType;
  c_dlcWarningText?: string;
  c_globalDlcProduct?: string;
  c_hreflangjson: string;
  c_isKeyRequiredBool?: boolean;
  c_legalLineEmea?: string;
  c_legalLineWW?: string;
  c_partOfUbisoftPlus?: boolean;
  c_peopleSoftEMEAItemId?: string;
  c_peopleSoftNCSAItemId?: string;
  c_productActivationMethodString?: CProductActivationMethodString;
  c_productActivationString?: string;
  c_productBaseProductIdString?: string;
  c_productBrandDisplayString?: string;
  c_productCategory?: string;
  c_productCoopBool?: boolean;
  c_productCustomReleaseDateString?: string;
  c_productDescriptionFirstParagraphString?: string;
  c_productDlcBaseString?: string;
  c_productEditionString?: string;
  c_productExtRefString?: string;
  c_productFirstThirdPartyGameString?: CProductFirstThirdPartyGameString;
  c_productGameDLC?: CProductGameDLC;
  c_productGenreTagString?: CProductGenreTagString;
  c_productInternalNameString: string;
  c_productIsDownloadBoolean?: boolean;
  c_productKeywordsString?: string;
  c_productLauncherIDString?: string;
  c_productLegalLinesHTML?: string;
  c_productMDMBrandIDString?: string;
  c_productMDMCustomerOfferIDString?: string;
  c_productMDMDevelopmentIDString?: string;
  c_productMDMIPCID?: string;
  c_productMDMInstallmentIDString?: string;
  c_productMultiBool?: boolean;
  c_productOtherEditionsListString?: string[];
  c_productOwnershipUplayGameID?: string;
  c_productPlatformString?: CProductPlatformString;
  c_productPromoMessageLink?: string;
  c_productPromoMessageString?: string;
  /**
   * @diff region
   */
  c_productRatingString?: GameRatingType;
  c_productReleaseDateString?: string;
  c_productReleaseDateTime: Date;
  c_productSKUString?: string;
  c_productShortNameString?: string;
  c_productSingleBool?: boolean;
  c_productSubBrandString?: string;
  c_productTaxGroupString?: CProductTaxGroupString;
  c_productTaxTypeString?: string;
  c_productTypeRefinementString?: CProductTypeRefinementString;
  c_productTypeSelect: CProductTypeSelect;
  c_productYoutubeIds?: string[];
  c_walletEligibleToRewards?: boolean;
  c_productDescriptionString?: string;
  c_availableForInStorePickup?: boolean;
  c_isNewtest?: boolean;
  c_isSale?: boolean;
  c_productRatingText?: string;
  /**
   * @diff region
   */
  c_enablePredictiveIntelligence?: boolean;
  c_productGenreDisplayString?: string;
  c_productPreorderOfferHTML?: string;
  c_productSinglePlayerString?: CProductPlayerString;
  c_productRatingReasonString?: string;
  /**
   * @diff region
   */
  page_description?: string;
  page_keywords?: string;
  c_forceUplayBox?: boolean;
  c_freeOfferEndDateTime?: Date;
  c_freeOfferProductLauncherId?: string;
  c_freeOfferProductType?: CFreeOfferProductType;
  c_freeOfferStartDateTime?: Date;
  c_freeOfferUplayGameID?: string;
  c_productLanguageString?: string;
  c_productMultiPlayerString?: CProductPlayerString;
  c_productTypeCategoryRefinementString?: CProductTypeCategoryRefinementString;
  c_display_price?: string;
  manufacturer_name?: string;
  c_anywherePlatforms?: CAnywherePlatform[];
  c_enableSecondaryCTA?: boolean;
  c_openInNewTab?: boolean;
  /**
   * @diff region
   */
  c_productDeveloperString?: string;
  c_productPublisherString?: string;
  c_secondaryCTALink?: string;
  c_secondaryCTAName?: string;
  c_supportedAudio?: LanguageSupported[];
  c_supportedInterfaces?: LanguageSupported[];
  c_supportedSubtitles?: LanguageSupported[];
  c_productSysReqMinHTML?: string;
  c_productSysReqRecHTML?: string;
  c_productAdHocOfferAid?: string;
  c_productAdHocOfferEndDateTime?: Date;
  c_productAdHocOfferStartDateTime?: Date;
  c_productIntroString?: string;
  c_productGameKeyFeaturesString?: string;
  c_productvideosfirst?: boolean;
  c_legalLineNcsa?: string;
  c_mediasSectionTitle?: string;
  /**
   * @diff region
   */
  c_seoFooter?: string;
  c_summarySectionTitle?: string;
  c_productPreorderBonusAid?: string;
  /**
   * @diff region
   */
  c_displayPrice?: string;
  c_showZeroPrice?: boolean;
  c_contentSectionTitle?: string;
  /**
   * @diff region
   */
  c_productCompareTableHTML?: string;
  c_productYouTubeIdEnumList?: string[];
  c_uplayPlusLegalLines?: string;
  c_productDiscoverAssetList?: string[];
  c_productReinsuranceSentencesList?: string[];
  c_secondaryCTAOnlineFrom?: Date;
  c_secondaryCTAOnlineTo?: Date;
  valid_from?: ValidFrom;
  c_compareSectionTitle?: string;
  c_productContentHTMLPC?: string;
  c_productMerchTypeString?: CProductMerchTypeString;
  c_excludeFromFeed?: boolean;
  c_productEditionContentString?: string;
  c_productRatingReasonText?: string;
  /**
   * @diff currency, region
   */
  price_max?: number;
  price_per_unit_max?: number;
  c_additionalPlatforms?: string[];
  c_productRatingAdditionalText?: string;
  c_dlcTitle?: string;
  c_openGraphHTML?: string;
  c_openGraphHTMLTagAttribute?: string;
  c_productRecommendedPcConfigString?: string;
  c_productGenreString?: string;
  /**
   * @diff region
   */
  c_productContentHTML?: string;
  c_requirementsSectionTitle?: string;
  short_description?: string;
  c_isNew?: boolean;
  c_productRequireShipping?: boolean;
  c_requireActivationNotification?: boolean;
  ean?: string;
  c_productTypeString?: CProductTypeString;
  c_productPlatformInfoAid?: string;
  c_GamingListproductLauncherIDStringPREMIUM?: string;
  c_partOfGamingListPREMIUM?: string;
  c_productPostLaunchOfferAid?: CProductPostLaunchOfferAid;
  c_productFeatureHTML?: string;
  c_productIsExclusiveBool?: boolean;
  c_editionCompareAsset?: CEditionCompareAsset;
  c_productMaxQtyInteger?: number;
  c_productMaxQuantityInteger?: number;
  c_productKeyFeatures2HTML?: string;
  c_comingSoonProduct?: boolean;
  c_productBannerYoutubeID?: string;
  c_productKeyFeatures1HTML?: string;
  c_discoverSectionTitle?: string;
  c_productEditionTagString?: string;
  c_productWeightInteger?: number;
  valid_to?: ValidTo;
  c_gameRating?: GameRatingType;
  c_pdpSections?: string[];
  c_freeOfferTitle?: string;
  c_productReinsuranceGiftSentencesList?: string[];
  c_uplayPlusBoxMention?: string;
  c_freeOfferContent?: string;
  c_smartDeliveryEnabled?: boolean;
  c_hostedVideosImgPath?: string[];
  c_hostedVideosPaths?: string[];
  c_bonusesSectionTitle?: string;
}

export enum CAnywherePlatform {
  Luna = 'luna',
}

export enum CDigitalItemNature {
  Digital = 'Digital',
}

export enum CDlcType {
  Currency = 'currency',
  Extensions = 'extensions',
  Seasonpass = 'seasonpass',
  Skins = 'skins',
}

export enum CEditionCompareAsset {
  PDPCompareACODWEB = 'pdp-compare-ACOD-WEB',
  PDPCompareFC5WEB = 'pdp-compare-FC5-WEB',
  PDPCompareSettlersWEB = 'pdp-compare-settlers-WEB',
  PDPCompareTC2WEB = 'pdp-compare-TC2-WEB',
}

export enum CFreeOfferProductType {
  Demo = 'demo',
  FreeWeekends = 'free-weekends',
  Freeplay = 'freeplay',
  Giveaway = 'giveaway',
}

export enum GameRatingType {
  AcbM = 'acb-m',
  All = 'ALL',
  CeroA = 'cero-a',
  CeroB = 'cero-b',
  CeroC = 'cero-c',
  CeroD = 'cero-d',
  CeroZ = 'cero-z',
  Class0 = 'class-0',
  Class12 = 'class-12',
  Class15 = 'class-15',
  Class18 = 'class-18',
  Class6 = 'class-6',
  EsrbE = 'esrb-e',
  EsrbE10 = 'esrb-e10',
  EsrbM = 'esrb-m',
  EsrbRp = 'esrb-rp',
  EsrbT = 'esrb-t',
  Grac12 = 'grac-12',
  IngNone = 'none',
  IngOflcR18 = 'oflc-R18',
  None = 'None',
  NotRequired = 'not-required',
  OflcG = 'oflc-g',
  OflcM = 'oflc-m',
  OflcMa15 = 'oflc-ma15',
  OflcPG = 'oflc-pg',
  OflcR18 = 'oflc-r18',
  OlfcPG = 'olfc-pg',
  Pegi12 = 'pegi-12',
  Pegi16 = 'pegi-16',
  Pegi18 = 'pegi-18',
  Pegi3 = 'pegi-3',
  Pegi7 = 'pegi-7',
  The12 = '12+',
  The15 = '15+',
  The18 = '18+',
  The3 = '3+',
  Usk0 = 'usk-0',
  Usk12 = 'usk-12',
  Usk16 = 'usk-16',
  Usk18 = 'usk-18',
  Usk3 = 'usk-3',
  Usk6 = 'usk-6',
}

export enum CProductActivationMethodString {
  Currency = 'Currency',
  Dlc = 'DLC',
  Uplay = 'Uplay',
}

export enum CProductFirstThirdPartyGameString {
  The1StParty = '1st Party',
  Ubisoft = 'UBISOFT',
}

export enum CProductGameDLC {
  Currency = 'Currency',
  Dlc = 'DLC',
  Game = 'Game',
  게임 = '게임',
  통화 = '통화',
}

export enum CProductGenreTagString {
  Action = 'action',
  ActionAdventure = 'action-adventure',
  ActionCoopMulti = 'action-coop-multi',
  ActionMulti = 'action-multi',
  ActionMultiFight = 'action-multi-fight',
  CProductGenreTagStringActionAdventure = 'Action/Adventure',
  CProductGenreTagStringCasual = 'Casual',
  CProductGenreTagStringStrategy = 'Strategy',
  Casual = 'casual',
  CityBuilderStrategy = 'City Builder, Strategy',
  F2P = 'f2p',
  FPS = 'fps',
  FPSCoop = 'fps-coop',
  FPSCoopMulti = 'fps-coop-multi',
  FPSMulti = 'fps-multi',
  FPSShooter = 'fps-shooter',
  Family = 'family',
  Fighting = 'fighting',
  Horror = 'horror',
  IndieActionAdventure = 'indie-action-adventure',
  PurpleActionAdventure = 'Action / Adventure',
  Puzzle = 'puzzle',
  RPG = 'rpg',
  Racing = 'racing',
  Shooter = 'shooter',
  ShooterCoOp = 'Shooter, Co-op',
  ShooterFPSCoOp = 'Shooter, FPS, Co-op',
  Simulation = 'simulation',
  Simulator = 'simulator',
  Sport = 'sport',
  Strategy = 'strategy',
}

export enum CProductMerchTypeString {
  VideoGames = 'Video Games',
}

export enum CProductPlayerString {
  LowerSim = 'sim',
  LowerYes = 'yes',
  Ja = 'Ja',
  Nee = 'Nee',
  Neen = 'Neen',
  Nein = 'Nein',
  No = 'No',
  Non = 'Non',
  Não = 'Não',
  OUI = 'Oui',
  Si = 'Si',
  Sim = 'Sim',
  Sì = 'Sì',
  Sí = 'Sí',
  Y = 'y',
  Yes = 'Yes',
  はい = 'はい',
  不 = '不',
  是 = '是',
  是的 = '是的',
  没有 = '没有',
  아니요 = '아니요',
  예 = '예',
}

export enum CProductPlatformString {
  PC = 'PC',
  PCDL = 'pc-dl',
  Pcdl = 'pcdl',
  WindowsPC = 'Windows PC',
}

export enum CProductPostLaunchOfferAid {
  DisclaimerOfflineDlc = 'disclaimer-offline-dlc',
  DisclaimerOfflineFc3Dlc = 'disclaimer-offline-fc3-dlc',
}

export enum CProductTaxGroupString {
  DigitalGoods = 'Digital Goods',
  SoftwareDownloadableAndPhysical = 'Software (Downloadable and Physical)',
}

export enum CProductTypeCategoryRefinementString {
  ActionAdventure = 'action-adventure',
  DLCS = 'DLCs',
  Dlc = 'DLC',
  Game = 'Game',
  Games = 'Games',
}

export enum CProductTypeRefinementString {
  Collectible = 'collectible',
  Dlc = 'dlc',
  Games = 'games',
  게임 = '게임',
}

export enum CProductTypeSelect {
  Game = 'game',
}

export enum CProductTypeString {
  Games = 'Games',
  게임 = '게임',
}

export enum LanguageSupported {
  Ar = 'ar',
  CN = 'cn',
  CNS = 'cn-s',
  CNT = 'cn-t',
  CS = 'cs',
  De = 'de',
  En = 'en',
  Es = 'es',
  EsLa = 'es-la',
  Fr = 'fr',
  Hu = 'hu',
  It = 'it',
  Jp = 'jp',
  Ko = 'ko',
  Nl = 'nl',
  Pl = 'pl',
  Pt = 'pt',
  PtBr = 'pt-br',
  Ro = 'ro',
  Ru = 'ru',
  Sv = 'sv',
  Th = 'th',
  Tr = 'tr',
}

export interface ImageGroup {
  _type: 'image_group';
  images: Image[];
  view_type: ViewType;
}

export interface Image {
  _type: 'image';
  alt: string;
  dis_base_link: string;
  link: string;
  title: string;
}

export enum ViewType {
  EditionPackshot = 'edition_packshot',
  Large = 'large',
  MediaSliderPD = 'media_slider_PD',
  Medium = 'medium',
  Pdpbanner = 'pdpbanner',
  Small = 'small',
}

export interface Inventory {
  _type: 'inventory';
  ats: number;
  backorderable: boolean;
  /**
   * @diff region
   */
  id: InventoryID;
  orderable: boolean;
  preorderable: boolean;
  stock_level: number;
}

export enum InventoryID {
  InventoryDemandwareASD = 'inventory_Demandware_ASD',
  InventoryDemandwareArvato = 'inventory_Demandware_Arvato',
  InventoryDemandwareCinram = 'inventory_Demandware_Cinram',
  InventoryDemandwareTechnicolor = 'inventory_Demandware_Technicolor',
}

export interface Master {
  _type: 'master';
  /**
   * @diff currency, region
   */
  link: string;
  master_id: string;
  orderable: boolean;
  /**
   * @diff currency
   */
  price?: number;
}

export interface ProductPromotion {
  _type: 'product_promotion';
  /**
   * @diff currency, region
   */
  link: string;
  promotional_price?: number;
  promotion_id: string;
}

export interface ProductType {
  _type: 'product_type';
  variant?: boolean;
  master?: boolean;
}

export interface ValidFrom {
  'default@us_ubisoft'?: Date;
  'default@cn_ubisoft'?: Date;
  'default@cn_uplaypc'?: Date;
  default?: Date;
  'default@anz_uplaypc'?: Date;
  'default@at_uplaypc'?: Date;
  'default@de_ubisoft'?: Date;
  'default@it_ubisoft'?: Date;
  'default@nl_ubisoft'?: Date;
  'default@ru_ubisoft'?: Date;
  'default@anz_ubisoft'?: Date;
  'default@at_ubisoft'?: Date;
  'default@ie_ubisoft'?: Date;
  'default@uk_uplaypc'?: Date;
  'default@it_uplaypc'?: Date;
  'default@fr_ubisoft'?: Date;
  'default@fr_uplaypc'?: Date;
  'default@ie_uplaypc'?: Date;
  'default@jp_ubisoft'?: Date;
  'default@sea_ubisoft'?: Date;
  'default@uk_ubisoft'?: Date;
  'default@eu_ubisoft'?: Date;
  'default@ru_uplaypc'?: Date;
  'default@jp_uplaypc'?: Date;
  'default@sea_uplaypc'?: Date;
  'default@de_uplaypc'?: Date;
  'default@eu_uplaypc'?: Date;
  'default@es_uplaypc'?: Date;
  'default@nl_uplaypc'?: Date;
  'default@es_ubisoft'?: Date;
  'default@ca_ubisoft'?: Date;
  'default@tr_ubisoft'?: Date;
  'default@tr_uplaypc'?: Date;
  'default@ca_uplaypc'?: Date;
  'default@br_ubisoft'?: Date;
  'default@br_uplaypc'?: Date;
  'default@us_uplaypc'?: Date;
  'default@kr_ubisoft'?: Date;
  'default@kr_uplaypc'?: Date;
  'default@us_south_park'?: Date;
  'default@ca_south_park'?: Date;
  'default@performance-tracker'?: Date;
}

export interface ValidTo {
  'default@jp_ubisoft'?: Date;
  'default@jp_uplaypc'?: Date;
  'default@anz_ubisoft'?: Date;
  'default@at_ubisoft'?: Date;
  default?: Date;
  'default@uk_ubisoft'?: Date;
  'default@de_ubisoft'?: Date;
  'default@it_ubisoft'?: Date;
  'default@nl_ubisoft'?: Date;
  'default@eu_ubisoft'?: Date;
  'default@fr_ubisoft'?: Date;
  'default@es_ubisoft'?: Date;
}

export interface Variant {
  _type: 'variant';
  /**
   * @diff currency, region
   */
  link: string;
  orderable: boolean;
  /**
   * @diff currency, region
   */
  price?: number;
  product_id: string;
  variation_values?: VariationValues;
}

export interface VariationValues {
  Platform: PlatformType;
}

export enum PlatformType {
  Pcdl = 'pcdl',
  Ps4 = 'ps4',
  Ps5 = 'ps5',
  Ps5Dig = 'ps5dig',
  Switch = 'switch',
  Switchdig = 'switchdig',
  Xbox1 = 'xbox1',
  Xboxdig = 'xboxdig',
  Xboxx = 'xboxx',
}

export interface VariationAttribute {
  _type: 'variation_attribute';
  id: NameEnum;
  name: NameEnum;
  values?: Value[];
}

export enum NameEnum {
  Plataforma = 'Plataforma',
  Platform = 'Platform',
  Plattformen = 'Plattformen',
  プラットフォーム = 'プラットフォーム',
  平台 = '平台',
}

export interface Value {
  _type: 'variation_attribute_value';
  description: string;
  name: string;
  orderable: boolean;
  value: PlatformType;
}

export interface StoreFaultResponse {
  _v: string;
  fault: Fault;
}

export type FaultType =
  | 'ClientAccessForbiddenException'
  | 'InvalidExpandParameterException'
  | 'MissingClientIdException'
  | 'ProductNotFoundException'
  | 'ProductNotFoundException'
  | 'ResourcePathNotFoundException'
  | 'SiteNotFoundException'
  | 'SiteOfflineException'
  | 'UnknownClientIdException'
  | 'UnknownLocaleException'
  | 'UnsupportedCurrencyException'
  | 'UnsupportedLocaleException';

export interface Fault {
  arguments?: Arguments;
  type: string;
  message: string;
}

export interface Arguments {
  [arg: string]: string | number | boolean;
}

export type StoreError = Error & Fault;
