export type AlgoliaRegionNoSea =
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
  | 'tr'
  | 'uk'
  | 'us';

export type AlgoliaRegion = AlgoliaRegionNoSea | 'sea';

export type AlgoliaIndexName =
  | ' ca_best_sellers_noRerank'
  | 'ca_best_sellers_noDescription'
  | 'ca_best_sellers_noReranking'
  | 'ca_release_date_query_suggestions'
  | 'fr_best_sellers_description'
  | 'fr_best_sellers_query_suggestions_new'
  | 'fr_best_sellers_query_suggestions_tmp'
  | 'fr_most_searched'
  | 'fr_release_date_facet'
  | 'fr_release_date_query_suggestions'
  | 'fr_web_release_date'
  | 'merlin_test'
  | 'null'
  | 'preprod_test'
  | 'sandbox_ca_best_sellers'
  | 'sandbox_ca_price_ascending'
  | 'sandbox_ca_price_descending'
  | 'sandbox_ca_release_date'
  | 'sandbox_ca_title_alphabetically'
  | 'sea_title_alphabeticallly'
  | 'test_release_date'
  | 'test_release_date_260'
  | 'test_yuriy_index'
  | 'test_yuriy_index2'
  | 'uat_fr_release_date'
  | 'uat_fr_release_date_query_suggestions'
  | 'uat_fr_release_date_query_suggestions_tmp'
  | 'uat_uk_release_date_query_suggestions'
  | 'us_best_seller_AI'
  | 'us_best_seller_noDescription'
  | 'us_best_sellers_noDescription'
  | 'us_release_date_query_suggestions'
  | `${AlgoliaRegion}_best_sellers_query_suggestions`
  | `${AlgoliaRegion}_best_sellers`
  | `${AlgoliaRegion}_custom_MFE`
  | `${AlgoliaRegion}_price_ascending`
  | `${AlgoliaRegion}_price_descending`
  | `${AlgoliaRegion}_product_suggestion`
  | `${AlgoliaRegion}_product_suggestion`
  | `${AlgoliaRegion}_products_data`
  | `${AlgoliaRegion}_release_date`
  | `${AlgoliaRegionNoSea}_title_alphabetically`
  | `${AlgoliaRegion}_release_date_UPC`;

export const algoliaIndexes: AlgoliaIndexName[] = [
  ' ca_best_sellers_noRerank',
  'anz_best_sellers',
  'anz_best_sellers_query_suggestions',
  'anz_custom_MFE',
  'anz_price_ascending',
  'anz_price_descending',
  'anz_product_suggestion',
  'anz_products_data',
  'anz_release_date',
  'anz_title_alphabetically',
  'at_best_sellers',
  'at_best_sellers_query_suggestions',
  'at_custom_MFE',
  'at_price_ascending',
  'at_price_descending',
  'at_product_suggestion',
  'at_products_data',
  'at_release_date',
  'at_release_date_UPC',
  'at_title_alphabetically',
  'br_best_sellers',
  'br_best_sellers_query_suggestions',
  'br_custom_MFE',
  'br_price_ascending',
  'br_price_descending',
  'br_product_suggestion',
  'br_products_data',
  'br_release_date',
  'br_title_alphabetically',
  'ca_best_sellers',
  'ca_best_sellers_noDescription',
  'ca_best_sellers_noReranking',
  'ca_best_sellers_query_suggestions',
  'ca_custom_MFE',
  'ca_price_ascending',
  'ca_price_descending',
  'ca_product_suggestion',
  'ca_products_data',
  'ca_release_date',
  'ca_release_date_UPC',
  'ca_release_date_query_suggestions',
  'ca_title_alphabetically',
  'cn_best_sellers',
  'cn_best_sellers_query_suggestions',
  'cn_custom_MFE',
  'cn_price_ascending',
  'cn_price_descending',
  'cn_product_suggestion',
  'cn_products_data',
  'cn_release_date',
  'cn_title_alphabetically',
  'de_best_sellers',
  'de_best_sellers_query_suggestions',
  'de_custom_MFE',
  'de_price_ascending',
  'de_price_descending',
  'de_product_suggestion',
  'de_products_data',
  'de_release_date',
  'de_release_date_UPC',
  'de_title_alphabetically',
  'es_best_sellers',
  'es_best_sellers_query_suggestions',
  'es_custom_MFE',
  'es_price_ascending',
  'es_price_descending',
  'es_product_suggestion',
  'es_products_data',
  'es_release_date',
  'es_release_date_UPC',
  'es_title_alphabetically',
  'eu_best_sellers',
  'eu_best_sellers_query_suggestions',
  'eu_custom_MFE',
  'eu_price_ascending',
  'eu_price_descending',
  'eu_product_suggestion',
  'eu_products_data',
  'eu_release_date',
  'eu_release_date_UPC',
  'eu_title_alphabetically',
  'fr_best_sellers',
  'fr_best_sellers_description',
  'fr_best_sellers_query_suggestions',
  'fr_best_sellers_query_suggestions_new',
  'fr_best_sellers_query_suggestions_tmp',
  'fr_custom_MFE',
  'fr_most_searched',
  'fr_price_ascending',
  'fr_price_descending',
  'fr_product_suggestion',
  'fr_products_data',
  'fr_release_date',
  'fr_release_date_UPC',
  'fr_release_date_facet',
  'fr_release_date_query_suggestions',
  'fr_title_alphabetically',
  'fr_web_release_date',
  'ie_best_sellers',
  'ie_best_sellers_query_suggestions',
  'ie_custom_MFE',
  'ie_price_ascending',
  'ie_price_descending',
  'ie_product_suggestion',
  'ie_products_data',
  'ie_release_date',
  'ie_title_alphabetically',
  'it_best_sellers',
  'it_best_sellers_query_suggestions',
  'it_custom_MFE',
  'it_price_ascending',
  'it_price_descending',
  'it_product_suggestion',
  'it_products_data',
  'it_release_date',
  'it_release_date_UPC',
  'it_title_alphabetically',
  'jp_best_sellers',
  'jp_best_sellers_query_suggestions',
  'jp_custom_MFE',
  'jp_price_ascending',
  'jp_price_descending',
  'jp_product_suggestion',
  'jp_products_data',
  'jp_release_date',
  'jp_title_alphabetically',
  'kr_best_sellers',
  'kr_best_sellers_query_suggestions',
  'kr_custom_MFE',
  'kr_price_ascending',
  'kr_price_descending',
  'kr_product_suggestion',
  'kr_products_data',
  'kr_release_date',
  'kr_title_alphabetically',
  'merlin_test',
  'nl_best_sellers',
  'nl_best_sellers_query_suggestions',
  'nl_custom_MFE',
  'nl_price_ascending',
  'nl_price_descending',
  'nl_product_suggestion',
  'nl_products_data',
  'nl_release_date',
  'nl_release_date_UPC',
  'nl_title_alphabetically',
  'null',
  'preprod_test',
  'ru_best_sellers',
  'ru_best_sellers_query_suggestions',
  'ru_custom_MFE',
  'ru_price_ascending',
  'ru_price_descending',
  'ru_product_suggestion',
  'ru_products_data',
  'ru_release_date',
  'ru_title_alphabetically',
  'sandbox_ca_best_sellers',
  'sandbox_ca_price_ascending',
  'sandbox_ca_price_descending',
  'sandbox_ca_release_date',
  'sandbox_ca_title_alphabetically',
  'sea_best_sellers',
  'sea_best_sellers_query_suggestions',
  'sea_custom_MFE',
  'sea_price_ascending',
  'sea_price_descending',
  'sea_product_suggestion',
  'sea_products_data',
  'sea_release_date',
  'sea_title_alphabeticallly',
  'test_release_date',
  'test_release_date_260',
  'test_yuriy_index',
  'test_yuriy_index2',
  'tr_best_sellers',
  'tr_best_sellers_query_suggestions',
  'tr_custom_MFE',
  'tr_price_ascending',
  'tr_price_descending',
  'tr_product_suggestion',
  'tr_products_data',
  'tr_release_date',
  'tr_title_alphabetically',
  'uat_fr_release_date',
  'uat_fr_release_date_query_suggestions',
  'uat_fr_release_date_query_suggestions_tmp',
  'uat_uk_release_date_query_suggestions',
  'uk_best_sellers',
  'uk_best_sellers_query_suggestions',
  'uk_custom_MFE',
  'uk_price_ascending',
  'uk_price_descending',
  'uk_product_suggestion',
  'uk_products_data',
  'uk_release_date',
  'uk_release_date_UPC',
  'uk_title_alphabetically',
  'us_best_seller_AI',
  'us_best_seller_noDescription',
  'us_best_sellers',
  'us_best_sellers_noDescription',
  'us_best_sellers_query_suggestions',
  'us_custom_MFE',
  'us_price_ascending',
  'us_price_descending',
  'us_product_suggestion',
  'us_products_data',
  'us_release_date',
  'us_release_date_UPC',
  'us_release_date_query_suggestions',
  'us_title_alphabetically',
];

export type Refinements = 'product_type' | 'Platform' | 'Game' | 'Genre' | 'Edition' | 'sub_brand';

export interface IAlgoliaProductItem {
  id: string;
  MasterID: string;
  title: number | string;
  link: string;
  image_link: string;
  additional_image_link: string;
  mobile_link: string;
  availability: AvailabilityEnum | number;
  availability_date: LocaleValueMap[] | string;
  sale_price_effective_date: string;
  google_product_category: GoogleProductCategoryEnum | number;
  product_type: LocaleValueMap[] | ProductTypeEnum | string;
  brand: 'Ubisoft';
  gtin: number | string;
  mpn: number | string;
  identifier_exists: Adult | number;
  adult: Adult;
  gender: Gender;
  Derived_products?: DerivedProducts;
  Game: string;
  Genre: LocaleValueMap[] | GenreEnum | string;
  Platform: string;
  Price_range?: string;
  Edition: number | string;
  Rating: Rating;
  html_description: LocaleValueMap[] | string;
  default_price: CurrencyPriceMap[] | number | string;
  price: CurrencyPriceMap[] | number | string;
  popularity: Rating;
  club_units: number | 'N/A';
  Novelty: Exclusivity;
  Exclusivity: Exclusivity;
  Free_offer: FreeOffer;
  Searchable: Exclusivity;
  promotion_percentage: number | string;
  preorder: string;
  dlcType: DlcType;
  release_year: number | string;
  short_title: string;
  default_price_additional_locales?: string;
  genre_additional_locales?: string;
  html_description_additional_locales?: string;
  minimum_price_additional_locales?: string;
  price_additional_locales?: string;
  price_range_additional_locales?: string;
  productTypeRefinement_additional_locales?: string;
  minimum_price: CurrencyPriceMap[] | string;
  upc_included: Exclusivity;
  availability_date_timestamp?: number;
  Loyalty_units?: string;
  objectID: string;
  _highlightResult: HighlightResult;
  price_range?: CurrencyPriceMap[] | string;
  merch_type?: DerivedProducts;
  linkWeb?: string;
  linkUpc?: string;
  platforms_availability?: string;
  sub_brand?: string;
  orders_data?: number | string;
  revenue_data?: number | string;
  comingSoon?: Exclusivity;
  MDMbrandID?: number | string;
  MDMinstallmentID?: number | string;
  partOfUbisoftPlus?: string;
  subscriptionOffer?: string;
  anywherePlatforms?: AnywherePlatforms;
  additional_image_links?: string;
  release_date?: string;
  productYoutubeIds?: string;
  productvideosfirst?: string;
  short_description?: LocaleValueMap[] | string;
  ibexRecurrencyLabel?: LocaleValueMap[];
  activation_method?: ActivationMethod;
  title_additional_locales?: AdditionalLocale[] | string;
  edition_additional_locales?: AdditionalLocale[] | string;
  isPrepaidCard?: string;
  customOOSMentionString?: string;
  productTypeSelect?: ProductTypeSelect;
  subscriptionExpirationDate?: string;
  SF_custom_label_23?: string;
  additional_image_link_1?: string;
  additional_image_link_2?: string;
  additional_image_link_3?: string;
  additional_image_link_4?: string;
  additional_image_link_5?: string;
}

export enum DerivedProducts {
  Accessories = 'Accessories',
  Bags = 'Bags',
  Beanies = 'Beanies',
  Belts = 'Belts',
  Books = 'Books',
  Caps = 'Caps',
  Collectibles = 'Collectibles',
  DressShirts = 'Dress Shirts',
  Empty = '',
  Figure = 'Figure',
  Figurines = 'Figurines',
  Flags = 'Flags',
  Hoodies = 'Hoodies',
  JacketsVests = 'Jackets & Vests',
  Jewelry = 'Jewelry',
  Pins = 'Pins',
  Polos = 'Polos',
  Prints = 'Prints',
  Replicas = 'Replicas',
  Scarves = 'Scarves',
  TShirts = 'T-Shirts',
  VideoGames = 'Video Games',
}

export enum Exclusivity {
  ComingSoon = '$comingSoon',
  No = 'No',
  Yes = 'Yes',
}

export enum FreeOffer {
  Demo = 'demo',
  Empty = '',
  FreeWeekends = 'free-weekends',
  Freeplay = 'freeplay',
  Giveaway = 'giveaway',
}

export interface LocaleValueMap {
  de_AT?: string;
  de_DE?: string;
  en_AU?: string;
  en_BR?: string;
  en_CA?: string;
  en_GB?: string;
  en_NZ?: string;
  en_SG?: string;
  en_SK?: string;
  en_TR?: string;
  en_US?: string;
  en_ZW?: string;
  es_BR?: string;
  es_ES?: string;
  es_US?: string;
  fr_CA?: string;
  fr_FR?: string;
  it_IT?: string;
  ja_JP?: string;
  ko_KR?: string;
  nl_NL?: string;
  pt_BR?: string;
  ru_RU?: string;
  th_TH?: string;
  zh_CN?: string;
  zh_HK?: string;
  zh_TW?: string;
}

export enum GenreEnum {
  ActionAdventure = 'Action / Adventure',
  Empty = '',
  Shooter = 'Shooter',
  Strategy = 'Strategy',
}

export enum Rating {
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
  Empty = '',
  EsrbE = 'esrb-e',
  EsrbE10 = 'esrb-e10',
  EsrbM = 'esrb-m',
  EsrbRPM = 'esrb-rpm',
  EsrbRp = 'esrb-rp',
  EsrbT = 'esrb-t',
  Grac12 = 'grac-12',
  None = 'none',
  NotRequired = 'not-required',
  OflcG = 'oflc-g',
  OflcM = 'oflc-m',
  OflcMa15 = 'oflc-ma15',
  OflcPG = 'oflc-pg',
  OflcR18 = 'oflc-r18',
  OlfcPG = 'olfc-pg',
  Pcbp18 = 'PCBP-18',
  Pegi12 = 'pegi-12',
  Pegi16 = 'pegi-16',
  Pegi18 = 'pegi-18',
  Pegi3 = 'pegi-3',
  Pegi7 = 'pegi-7',
  RatingNone = 'None',
  RatingOflcR18 = 'oflc-R18',
  RatingPegi7 = 'Pegi-7',
  Ru0 = 'ru-0',
  Ru12 = 'ru-12',
  Ru16 = 'ru-16',
  Ru18 = 'ru-18',
  Ru6 = 'ru-6',
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
  Usk7 = 'usk-7',
  Usk8 = 'usk-8',
}

export interface HighlightResult {
  id: EditionValue;
  title: EditionValue;
  Game: EditionValue;
  Genre: { [key: string]: EditionValue }[] | EditionValue;
  Platform: EditionValue;
  Edition: EditionValue;
  html_description?: { [key: string]: EditionValue }[] | EditionValue;
  Free_offer: EditionValue;
  Searchable?: EditionValue;
  MasterID?: EditionValue;
  short_description?: { [key: string]: EditionValue }[] | EditionValue;
  minimum_price?: { [key: string]: EditionValue }[];
  dlcType?: EditionValue;
  link?: EditionValue;
  image_link?: EditionValue;
  additional_image_link?: EditionValue;
  mobile_link?: EditionValue;
  availability?: EditionValue;
  availability_date?: { [key: string]: EditionValue }[];
  sale_price_effective_date?: EditionValue;
  google_product_category?: EditionValue;
  product_type?: { [key: string]: EditionValue }[];
  brand?: EditionValue;
  gtin?: EditionValue;
  mpn?: EditionValue;
  identifier_exists?: EditionValue;
  adult?: EditionValue;
  gender?: EditionValue;
  Rating?: EditionValue;
  default_price?: { [key: string]: EditionValue }[];
  price?: { [key: string]: EditionValue }[];
  price_range?: { [key: string]: EditionValue }[];
  merch_type?: EditionValue;
  popularity?: EditionValue;
  club_units?: EditionValue;
  Novelty?: EditionValue;
  Exclusivity?: EditionValue;
  promotion_percentage?: EditionValue;
  preorder?: EditionValue;
  release_year?: EditionValue;
  short_title?: EditionValue;
  upc_included?: EditionValue;
  linkWeb?: EditionValue;
  linkUpc?: EditionValue;
  platforms_availability?: EditionValue;
  sub_brand?: EditionValue;
  orders_data?: EditionValue;
  revenue_data?: EditionValue;
  comingSoon?: EditionValue;
  MDMbrandID?: EditionValue;
  MDMinstallmentID?: EditionValue;
  partOfUbisoftPlus?: EditionValue;
  subscriptionOffer?: EditionValue;
  anywherePlatforms?: EditionValue;
  additional_image_link_1?: EditionValue;
  additional_image_link_2?: EditionValue;
  additional_image_link_3?: EditionValue;
  additional_image_link_4?: EditionValue;
  additional_image_link_5?: EditionValue;
  release_date?: EditionValue;
  productYoutubeIds?: EditionValue;
  productvideosfirst?: EditionValue;
  ibexRecurrencyLabel?: { [key: string]: EditionValue }[];
  activation_method?: EditionValue;
  Loyalty_units?: EditionValue;
}

export interface EditionValue {
  value: string;
  matchLevel: Rating;
  matchedWords: unknown[];
}

export enum ActivationMethod {
  Currency = 'Currency',
  Dlc = 'DLC',
  Empty = '',
  Mobile = 'Mobile',
  Oculus = 'Oculus',
  Uplay = 'Uplay',
}

export enum Adult {
  FalseLower = 'False',
  Empty = '',
  False = 'FALSE',
}

export enum AnywherePlatforms {
  Empty = '',
  Luna = '["luna"]',
}

export enum AvailabilityEnum {
  Empty = '',
  InStock = 'in stock',
  Preorder = 'preorder',
}

export enum DlcType {
  Currency = 'currency',
  Empty = '',
  Extensions = 'extensions',
  Seasonpass = 'seasonpass',
  Skins = 'skins',
}

export interface AdditionalLocale {
  en_SG: string;
  th_TH: string;
  zh_HK: string;
  zh_TW: string;
}

export enum Gender {
  Empty = '',
  Unisex = 'unisex',
}

export enum GoogleProductCategoryEnum {
  BlackFriday = 'Black Friday',
  Empty = '',
  Expansão = 'Expansão',
  Franquias = 'Franquias',
  Games = 'Games',
  GiftCard = 'Gift Card',
  GoogleProductCategory = '$',
  Hidden = 'Hidden',
  Jogos = 'Jogos',
  JogosGrátis = 'Jogos grátis',
  Novidades = 'Novidades',
  PromoçãoDeAnoNovoLunar = 'Promoção de Ano Novo Lunar',
  PromoçãoDeOutono = 'Promoção de outono',
  Promoções = 'Promoções',
  Store = 'Store',
  StorefrontNCSA = 'Storefront NCSA',
}

export interface CurrencyPriceMap {
  ARS?: number | string;
  AUD?: number | string;
  BRL?: number | string;
  CAD?: number | string;
  CLP?: number | string;
  CNY?: number | string;
  COP?: number | string;
  CRC?: number | string;
  CZK?: number | string;
  DKK?: number | string;
  EUR?: number | string;
  GBP?: number | string;
  HKD?: number | string;
  HUF?: number | string;
  IDR?: number | string;
  JPY?: number | string;
  KRW?: number | string;
  MXN?: number | string;
  MYR?: number | string;
  NOK?: number | string;
  NZD?: number | string;
  PEN?: number | string;
  PHP?: number | string;
  PLN?: number | string;
  RUB?: number | string;
  SEK?: number | string;
  SGD?: number | string;
  THB?: number | string;
  TRY?: number | string;
  TWD?: number | string;
  UAH?: number | string;
  USD?: number | string;
  UYU?: number | string;
}

export enum ProductTypeSelect {
  Collectible = 'collectible',
  Empty = '',
  Freetoplay = 'freetoplay',
  Game = 'game',
  PrepaidCard = 'Prepaid Card',
}

export enum ProductTypeEnum {
  Collectibles = 'Collectibles',
  DLCS = 'DLCs',
  Empty = '',
  Games = 'Games',
}
