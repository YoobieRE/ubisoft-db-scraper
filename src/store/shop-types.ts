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

export type StoreRegion =
  | `${CountryCode}_ubisoft`
  | `${CountryCode}_uplaypc`
  | 'ca_south_park'
  | 'us_south_park' // same as us_ubisoft
  | 'performance-tracker';

export const currencyCountryMap: Record<StoreCurrency, CountryCode[]> = {
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
export type StoreCurrency =
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

// https://overlay.ubisoft.com/overlay-connect-integration/widget.js
export type ShopLocale =
  | 'ar-AE'
  | 'zh-CN'
  | 'zh-TW'
  | 'zh-HK'
  | 'cs-CZ'
  | 'da-DK'
  | 'nl-NL'
  | 'en-GB'
  | 'en-CA'
  | 'en-US'
  | 'fi-FI'
  | 'fr-FR'
  | 'fr-CA'
  | 'de-DE'
  | 'hu-HU'
  | 'it-IT'
  | 'ja-JP'
  | 'ko-KR'
  | 'nb-NO'
  | 'pl-PL'
  | 'pt-PT'
  | 'pt-BR'
  | 'ru-RU'
  | 'es-ES'
  | 'es-MX'
  | 'sv-SE'
  | 'th-TH'
  | 'tr-TR'
  | 'uk-UA';

export type DataSection = 'images' | 'variations' | 'prices' | 'promotions' | 'availability';

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

export interface ProductsResponseBody {
  _v: string;
  _type: string;
  count: number;
  data?: Product[];
  total: number;
}

export interface Product {
  _type: string;
  brand: string;
  currency: string;
  id: string;
  image_groups: ImageGroup[];
  inventory: Inventory;
  long_description: string;
  manufacturer_name: string;
  master: Master;
  min_order_quantity: number;
  name: string;
  page_keywords?: string;
  price: number;
  price_max?: number;
  primary_category_id: string;
  product_promotions: ProductPromotion[];
  step_quantity: number;
  type: Type;
  valid_from: ValidFrom;
  variants: Variant[];
  variation_attributes: VariationAttribute[];
  c_compareSectionTitle?: string;
  c_discoverSectionTitle?: string;
  c_enablePredictiveIntelligence: boolean;
  c_forceUplayBox?: boolean;
  c_freeOfferEndDateTime?: string;
  c_freeOfferProductLauncherId?: string;
  c_freeOfferProductType?: string;
  c_freeOfferStartDateTime?: string;
  c_freeOfferUplayGameID?: string;
  c_hreflangjson: string;
  c_isNew: boolean;
  c_legalLineEmea?: string;
  c_legalLineNcsa?: string;
  c_legalLineWW: string;
  c_mediasSectionTitle?: string;
  c_partOfUbisoftPlus: boolean;
  c_productAdHocOfferAid: string;
  c_productAdHocOfferEndDateTime: string;
  c_productAdHocOfferStartDateTime: string;
  c_productBrandDisplayString: string;
  c_productCompareTableHTML: string;
  c_productContentHTML: string;
  c_productCoopBool: boolean;
  c_productCustomReleaseDateString: string;
  c_productDescriptionFirstParagraphString: string;
  c_productDeveloperString: string;
  c_productEditionString: string;
  c_productGameDLC?: string;
  c_productGenreDisplayString: string;
  c_productGenreTagString: string;
  c_productInternalNameString: string;
  c_productIsDownloadBoolean?: boolean;
  c_productKeywordsString?: string;
  c_productMultiBool: boolean;
  c_productOtherEditionsListString: string[];
  c_productPreorderBonusAid?: string;
  c_productPublisherString: string;
  c_productRatingAdditionalText?: string;
  c_productRatingString?: string;
  c_productRatingText?: string;
  c_productReleaseDateTime: string;
  c_productShortNameString: string;
  c_productSingleBool: boolean;
  c_productSinglePlayerString?: string;
  c_productSubBrandString: string;
  c_productTypeCategoryRefinementString?: string;
  c_productTypeRefinementString: string;
  c_productTypeSelect: string;
  c_productYoutubeIds: string[];
  c_productvideosfirst?: boolean;
  c_seoFooter?: string;
  c_summarySectionTitle?: string;
  c_supportedAudio?: string[];
  c_supportedInterfaces?: string[];
  c_supportedSubtitles?: string[];
  c_uplayPlusLegalLines?: string;
  c_walletEligibleToRewards: boolean;
  c_display_price: string;
  c_productActivationString?: string;
  c_productPlatformString?: string;
  c_contentSectionTitle?: string;
  c_productActivationMethodString?: string;
  c_productPreorderOfferHTML?: string;
  c_anywherePlatforms?: string[];
}

export interface ImageGroup {
  _type: string;
  images: Image[];
  view_type: string;
}

export interface Image {
  _type: ImageType;
  alt: string;
  dis_base_link: string;
  link: string;
  title: string;
}

export enum ImageType {
  Image = 'image',
}

export interface Inventory {
  _type: string;
  ats: number;
  backorderable: boolean;
  id: string;
  orderable: boolean;
  preorderable: boolean;
  stock_level: number;
}

export interface Master {
  _type: string;
  link: string;
  master_id: string;
  orderable: boolean;
  price: number;
}

export interface ProductPromotion {
  _type: ProductPromotionType;
  link: string;
  promotion_id: string;
}

export enum ProductPromotionType {
  ProductPromotion = 'product_promotion',
}

export interface Type {
  _type: string;
  master: boolean;
}

export interface ValidFrom {
  default?: string;
  'default@anz_uplaypc'?: string;
  'default@at_uplaypc'?: string;
  'default@cn_uplaypc'?: string;
  'default@de_ubisoft'?: string;
  'default@it_ubisoft'?: string;
  'default@nl_ubisoft'?: string;
  'default@us_ubisoft'?: string;
  'default@ru_ubisoft'?: string;
  'default@performance-tracker'?: string;
  'default@ca_ubisoft'?: string;
  'default@anz_ubisoft'?: string;
  'default@at_ubisoft'?: string;
  'default@cn_ubisoft'?: string;
  'default@ie_ubisoft'?: string;
  'default@tr_ubisoft'?: string;
  'default@kr_ubisoft'?: string;
  'default@uk_uplaypc'?: string;
  'default@it_uplaypc'?: string;
  'default@fr_ubisoft'?: string;
  'default@fr_uplaypc'?: string;
  'default@ie_uplaypc'?: string;
  'default@jp_ubisoft'?: string;
  'default@tr_uplaypc'?: string;
  'default@sea_ubisoft'?: string;
  'default@uk_ubisoft'?: string;
  'default@eu_ubisoft'?: string;
  'default@kr_uplaypc'?: string;
  'default@ca_south_park'?: string;
  'default@ru_uplaypc'?: string;
  'default@jp_uplaypc'?: string;
  'default@sea_uplaypc'?: string;
  'default@ca_uplaypc'?: string;
  'default@de_uplaypc'?: string;
  'default@eu_uplaypc'?: string;
  'default@us_south_park'?: string;
  'default@es_uplaypc'?: string;
  'default@br_ubisoft'?: string;
  'default@br_uplaypc'?: string;
  'default@nl_uplaypc'?: string;
  'default@us_uplaypc'?: string;
  'default@es_ubisoft'?: string;
}

export interface Variant {
  _type: VariantType;
  link: string;
  orderable: boolean;
  price?: number;
  product_id: string;
  variation_values: VariationValues;
}

export enum VariantType {
  Variant = 'variant',
}

export interface VariationValues {
  Platform: string;
}

export interface VariationAttribute {
  _type: string;
  id: string;
  name: string;
  values: Value[];
}

export interface Value {
  _type: ValueType;
  description: string;
  name: string;
  orderable: boolean;
  value: string;
}

export enum ValueType {
  VariationAttributeValue = 'variation_attribute_value',
}

export interface ShopFaultResponse {
  _v: string;
  fault: Fault;
}

export interface Fault {
  arguments: Arguments;
  type: string;
  message: string;
}

export interface Arguments {
  locale: string;
}
