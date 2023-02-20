import { EmbedBuilder } from '@discordjs/builders';
import type { APIEmbedField, APIEmbedThumbnail } from 'discord-api-types/v10';
import { diffString, diff, DiffStringOptions } from 'json-diff';
import mongoose from 'mongoose';
import Discord from 'discord.js';
import { Logger } from 'pino';
import { game_configuration, product_store_configuration } from 'ubisoft-demux';
import deepEqual from 'fast-deep-equal';
import { LauncherVersionDocument } from '../schema/launcher-version';
import {
  IExpandedStoreProduct,
  IProduct,
  IStoreTypeProductMap,
  Product,
  ProductDocument,
} from '../schema/product';
import { ProductRevision } from '../schema/product-revision';
import { DiscordBot } from '../bot/discord-bot';
import { DiscordUpdateChannelList } from '../common/config';

export interface ProductNameResult {
  altNames?: string[];
  name?: string;
}
export interface DiscordReporterProps {
  discordBot: DiscordBot;
  updateChannels: DiscordUpdateChannelList;
  logger: Logger;
  disabled?: boolean;
}

const MAX_TOTAL_MESSAGE_LENGTH = 1024;

function documentCleaner<T>(document: mongoose.Document<unknown, unknown, T> & T): T {
  const docObject = document.toObject();
  const cleanDoc = Object.fromEntries(
    Object.entries(docObject).filter(
      ([key]) => !key.startsWith('_') && !['createdAt', 'updatedAt'].includes(key)
    )
  ) as unknown as T;
  return cleanDoc;
}

function trimCodeBlock(code: string): string {
  const blockPrefix = '```diff\n';
  const blockSuffix = '```';
  const extraChars = blockPrefix.length + blockSuffix.length;

  const maxBlockLength = MAX_TOTAL_MESSAGE_LENGTH - extraChars;

  let trimmedCode = code;
  if (code.length > maxBlockLength) trimmedCode = code.substring(0, maxBlockLength);

  return `${blockPrefix}${trimmedCode}${blockSuffix}`;
}

export default class DiscordReporter {
  private updateChannels: DiscordUpdateChannelList;

  private author = 'YoobieTracker';

  private authorIcon = 'https://avatars.githubusercontent.com/u/110780530';

  private authorUrl = 'https://github.com/YoobieTracker';

  private L: Logger;

  private disabled: boolean;

  private discord: Discord.Client<true>;

  constructor(props: DiscordReporterProps) {
    if (!props.updateChannels.default)
      throw new Error('Discord webhook list must have a "default" webhook');
    this.updateChannels = props.updateChannels;
    this.L = props.logger;
    this.disabled = props.disabled || false;
    this.discord = props.discordBot.client;
  }

  public async sendProductUpdates(
    newProduct: ProductDocument,
    oldProduct?: ProductDocument
  ): Promise<void> {
    if (this.disabled) return;
    this.L.debug({ productId: newProduct.productId }, 'Creating Discord product update');
    const cleanNewProduct = documentCleaner(newProduct);
    const cleanOldProduct = oldProduct ? documentCleaner(oldProduct) : undefined;
    const { productId } = cleanNewProduct;

    // If the change is only a switch in storePartner, just skip it
    const changesObj = diff(cleanOldProduct, cleanNewProduct);
    const pastVersions = await ProductRevision.find({ productId }).sort({ _id: -1 }).limit(3); // Ordering by _id since timestamps were broken previously
    const cleanPastVersions = pastVersions.map((d) => documentCleaner<ProductDocument>(d));
    if (
      deepEqual(cleanNewProduct, cleanPastVersions[1]) &&
      deepEqual(cleanPastVersions[0], cleanPastVersions[2])
    ) {
      this.L.debug({ changesObj }, 'Detected state oscillation, skipping notification');
      return; // skip
    }
    let changes = diffString(cleanOldProduct, cleanNewProduct, {
      color: false,
      maxElisions: 1,
    } as DiffStringOptions); // TODO: waiting on: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/62173

    if (changes.length > 1024 - 7) changes = changes.substring(0, 1024 - 7);

    changes = `\`\`\`\n${changes}\`\`\``;

    const isNew = cleanOldProduct === undefined;
    const description = isNew
      ? `A new productId ${productId} was added`
      : `An update for productId ${productId} was detected`;

    const color = isNew ? 5763719 : 5793266; // Green // Blurple

    const thumbnailUrl = this.getBestConfigProductImageUrl(cleanNewProduct);
    let thumbnailEmbed: APIEmbedThumbnail | undefined;
    if (thumbnailUrl) thumbnailEmbed = { url: thumbnailUrl };

    const { name: title, altNames } = this.getBestConfigProductName(cleanNewProduct);

    const fields: APIEmbedField[] = [{ name: 'Changes', value: changes }];

    if (altNames?.length) {
      fields.unshift({ name: 'Other Names', value: altNames.join('; ') });
    }

    const embed = new EmbedBuilder({
      author: {
        name: this.author,
        icon_url: this.authorIcon,
        url: this.authorUrl,
      },
      title,
      thumbnail: thumbnailEmbed,
      description,
      color,
      fields,
    });

    const channelId = this.updateChannels.default;

    await this.sendDiscordMessage(channelId, embed);
  }

  public async sendStoreServiceProductUpdate(
    newProduct: IStoreTypeProductMap,
    oldProduct?: IStoreTypeProductMap
  ): Promise<void> {
    if (this.disabled) return;
    const productId = newProduct.ingame?.productId || newProduct.upsell?.productId;
    if (!productId) return;
    this.L.debug({ productId }, 'Creating Discord store service product update');

    // If the change is only a switch in storePartner, just skip it
    const changesObj = diff(newProduct, oldProduct);
    const pastVersions = await ProductRevision.find({ productId }).sort({ _id: -1 }).limit(3); // Ordering by _id since timestamps were broken previously
    const cleanPastVersions = pastVersions.map((d) => documentCleaner<ProductDocument>(d));
    if (
      deepEqual(newProduct, cleanPastVersions[1].storeProduct) &&
      deepEqual(cleanPastVersions[0].storeProduct, cleanPastVersions[2].storeProduct)
    ) {
      this.L.debug({ changesObj }, 'Detected state oscillation, skipping notification');
      return; // skip
    }
    let changes = diffString(oldProduct, newProduct, {
      color: false,
      maxElisions: 1,
    });

    changes = trimCodeBlock(changes);

    const isNew = oldProduct === undefined;
    const description = isNew
      ? `A new productId ${productId} was added`
      : `An update for productId ${productId} was detected`;

    const color = isNew ? 5763719 : 5793266; // Green // Blurple

    const thumbnailUrl = this.getBestStoreProductImageUrl(newProduct);
    let thumbnailEmbed: APIEmbedThumbnail | undefined;
    if (thumbnailUrl) thumbnailEmbed = { url: thumbnailUrl };

    const { name: title, altNames } = await this.getBestProductName(productId);

    const fields: APIEmbedField[] = [{ name: 'Changes', value: changes }];

    const associatedProducts = await this.getAssociatedStoreProducts(newProduct);
    const associatedNameSet = new Set<string>();
    await Promise.all(
      Array.from(associatedProducts).map(async (id) => {
        const { name } = await this.getBestProductName(id);
        if (name) associatedNameSet.add(name);
      })
    );
    if (associatedNameSet.size) {
      const listString = Array.from(associatedNameSet).reduce((acc, curr) => {
        const separator = '; ';
        if (acc.length + separator.length + curr.length > 1024) return acc;
        return acc + separator + curr;
      });
      fields.unshift({ name: 'Associated Products', value: listString });
    }

    if (altNames?.length) {
      fields.unshift({ name: 'Other Names', value: altNames.join('; ') });
    }

    const embed = new EmbedBuilder({
      author: {
        name: this.author,
        icon_url: this.authorIcon,
        url: this.authorUrl,
      },
      title,
      thumbnail: thumbnailEmbed,
      description,
      color,
      fields,
    });

    const channelId = this.updateChannels.storeService || this.updateChannels.default;

    await this.sendDiscordMessage(channelId, embed);
  }

  public async sendLauncherUpdate(newVersion: LauncherVersionDocument): Promise<void> {
    if (this.disabled) return;
    this.L.debug({ newVersion }, 'Creating Discord launcher update');

    const embed = new EmbedBuilder({
      author: {
        name: this.author,
        icon_url: this.authorIcon,
        url: this.authorUrl,
      },
      title: 'Ubisoft Connect',
      description: 'An update for Ubisoft Connect was detected',
      color: 5793266, // Blurple
      fields: [
        { name: 'Patch Track ID', value: newVersion.patchTrackId, inline: true },
        { name: 'Version Number', value: newVersion.latestVersion.toString(), inline: true },
      ],
    });

    const channelId = this.updateChannels.launcher || this.updateChannels.default;

    await this.sendDiscordMessage(channelId, embed);
  }

  private async sendDiscordMessage(channelId: string, embed: EmbedBuilder): Promise<void> {
    this.L.debug({ channelId }, 'Sending message to update channel');
    try {
      const channel = await this.discord.channels.fetch(channelId);
      if (!channel?.isTextBased())
        throw new Error(`Discord channel ${channelId} is not text-based`);
      await channel.send({ embeds: [embed] });
    } catch (err) {
      this.L.error(err);
    }
  }

  private async getAssociatedStoreProducts(product: IStoreTypeProductMap): Promise<Set<number>> {
    const associatedProductIds = new Set<number>();
    const productId = product.ingame?.productId || product.upsell?.productId;
    if (!productId) return associatedProductIds;

    const storeProducts: IExpandedStoreProduct[] = Object.values(product);
    storeProducts.forEach((storeProduct) => {
      // TODO: handle upsell additionalContent and gamePackages
      [storeProduct.associations, storeProduct.ownershipAssociations].forEach((associationList) => {
        if (associationList?.length) {
          associationList.forEach((associatedId) => {
            associatedProductIds.add(associatedId);
          });
        }
      });
    });
    this.L.debug(
      { associatedProductsCount: associatedProductIds.size, productId },
      'Got list of product associations'
    );

    const associateProducts = await Product.find({
      $or: [
        { 'storeProduct.upsell.associations': productId },
        { 'storeProduct.upsell.ownershipAssociations': productId },
        { 'storeProduct.ingame.associations': productId },
        { 'storeProduct.ingame.ownershipAssociations': productId },
      ],
    });
    this.L.debug(
      { associateProductsCount: associateProducts.length, productId },
      'Got list of associate products'
    );
    associateProducts.forEach((p) => associatedProductIds.add(p.productId));
    return associatedProductIds;
  }

  private async getBestProductName(productId: number): Promise<ProductNameResult> {
    const latestConfigVersions = await ProductRevision.find({ productId })
      .sort({ _id: -1 })
      .limit(2); // Ordering by _id since timestamps were broken previously
    let bestName: ProductNameResult = {};
    latestConfigVersions.some((rev) => {
      const revName = this.getBestConfigProductName(rev);
      if (!revName.name) return false;
      bestName = revName;
      return true;
    });
    return bestName;
  }

  private getBestConfigProductName(product: IProduct): ProductNameResult {
    const productRoot = (product.configuration as game_configuration.Configuration)?.root;
    const allNames = [
      productRoot?.name,
      productRoot?.installer?.game_identifier,
      productRoot?.sort_string,
      productRoot?.display_name,
      productRoot?.start_game?.online?.executables?.[0]?.shortcut_name,
      productRoot?.start_game?.offline?.executables?.[0]?.shortcut_name,
    ].filter((name): name is string => Boolean(name));
    this.L.trace({ allNames }, 'getting best name from all names');
    const name = allNames[0];
    const altNames = allNames.slice(1);
    return { name, altNames };
  }

  private getBestStoreProductImageUrl(product: IStoreTypeProductMap): string | undefined {
    const upsellConfig = product?.upsell
      ?.configuration as product_store_configuration.UpsellStoreConfiguration;
    const ingameConfig = product?.ingame
      ?.configuration as product_store_configuration.IngameStoreConfiguration;
    const viableImages = [
      upsellConfig?.assets?.featured,
      upsellConfig?.assets?.logo,
      upsellConfig?.assets?.small,
      ingameConfig?.assets?.productImage,
      ingameConfig?.assets?.logo,
      ingameConfig?.assets?.background,
      ...(ingameConfig?.assets?.imageGallery || []),
    ];
    this.L.trace({ viableImages }, 'getting best image from all store product images');

    const thumbnailFileName = viableImages.find((image) => (image as string)?.includes('.'));
    if (!thumbnailFileName) return undefined;
    return `http://static3.cdn.ubi.com/orbit/uplay_launcher_3_0/assets/${thumbnailFileName}`;
  }

  private getBestConfigProductImageUrl(product: IProduct): string | undefined {
    const productRoot = (product.configuration as game_configuration.Configuration)?.root;
    const viableImages = [
      productRoot?.thumb_image,
      productRoot?.icon_image,
      productRoot?.splash_image,
      productRoot?.logo_image,
    ];
    this.L.trace({ viableImages }, 'getting best image from all images');

    const thumbnailFileName = viableImages.find((image) => (image as string)?.includes('.'));
    if (!thumbnailFileName) return undefined;
    return `http://static3.cdn.ubi.com/orbit/uplay_launcher_3_0/assets/${thumbnailFileName}`;
  }
}
