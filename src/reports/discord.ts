import { EmbedBuilder } from '@discordjs/builders';
import type { APIEmbedField, APIEmbedThumbnail } from 'discord-api-types/v10';
import { diffString } from 'json-diff';
import mongoose from 'mongoose';
import phin from 'phin';
import { Logger } from 'pino';
import { game_configuration } from 'ubisoft-demux';
import pRetry from 'p-retry';
import { LauncherVersionDocument } from '../schema/launcher-version';
import { IExpandedStoreProduct, IProduct, Product, ProductDocument } from '../schema/product';

export interface DiscordChannelWebhookList {
  default: string;
  launcher: string;
  [productId: string]: string;
}

export interface DiscordReporterProps {
  channelWebhooks: DiscordChannelWebhookList;
  logger: Logger;
  disabled?: boolean;
}

function documentCleaner<T>(document: mongoose.Document<unknown, unknown, T> & T): T {
  const docObject = document.toObject();
  const cleanDoc = Object.fromEntries(
    Object.entries(docObject).filter(
      ([key]) => !key.startsWith('_') && !['createdAt', 'updatedAt'].includes(key)
    )
  ) as unknown as T;
  return cleanDoc;
}

export default class DiscordReporter {
  private channelWebhooks: Map<string, string>;

  private defaultWebhook: string;

  private launcherWebhook: string | undefined;

  private author = 'YoobieTracker';

  private authorIcon = 'https://avatars.githubusercontent.com/u/110780530';

  private authorUrl = 'https://github.com/YoobieTracker';

  private L: Logger;

  private disabled: boolean;

  constructor(props: DiscordReporterProps) {
    if (!props.channelWebhooks.default)
      throw new Error('Discord webhook list must have a "default" webhook');
    this.defaultWebhook = props.channelWebhooks.default;
    this.launcherWebhook = props.channelWebhooks.launcher;
    this.channelWebhooks = new Map(Object.entries(props.channelWebhooks));
    this.L = props.logger;
    this.disabled = props.disabled || false;
  }

  public async sendProductUpdates(
    newProduct: ProductDocument,
    oldProduct?: ProductDocument
  ): Promise<void> {
    if (this.disabled) return;
    const cleanNewProduct = documentCleaner(newProduct);
    const cleanOldProduct = oldProduct ? documentCleaner(oldProduct) : undefined;
    const { productId } = cleanNewProduct;

    let changes = diffString(cleanOldProduct, cleanNewProduct, {
      color: false,
    });

    if (changes.length > 1024 - 7) changes = changes.substring(0, 1024 - 7);

    changes = `\`\`\`\n${changes}\`\`\``;

    const isNew = cleanOldProduct === undefined;
    const description = isNew
      ? `A new productId ${productId} was added`
      : `An update for productId ${productId} was detected`;

    const color = isNew ? 5763719 : 5793266; // Green // Blurple

    const thumbnailUrl = this.getBestProductImageUrl(cleanNewProduct);
    let thumbnailEmbed: APIEmbedThumbnail | undefined;
    if (thumbnailUrl) thumbnailEmbed = { url: thumbnailUrl };

    const { name: title, altNames } = this.getBestProductName(cleanNewProduct);

    const fields: APIEmbedField[] = [{ name: 'Changes', value: changes }];

    const associatedProducts = await this.getAssociatedProducts(cleanNewProduct);
    const associatedNameSet = new Set<string>();
    associatedProducts.forEach((p) => {
      const { name } = this.getBestProductName(p);
      if (name) associatedNameSet.add(name);
    });
    if (associatedNameSet.size) {
      const listString = Array.from(associatedNameSet).reduce((acc, curr) => {
        const separator = '; ';
        if (acc.length + separator.length + curr.length > 1024) return acc;
        return acc + separator + curr;
      });
      fields.unshift({ name: 'Associated Names', value: listString });
    }

    if (altNames.length) {
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

    const webhookUrl = this.channelWebhooks.get(productId.toString()) || this.defaultWebhook;

    await this.sendDiscordMessage(webhookUrl, embed);
  }

  public async sendLauncherUpdate(newVersion: LauncherVersionDocument): Promise<void> {
    if (this.disabled) return;
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

    const webhookUrl = this.launcherWebhook || this.defaultWebhook;
    await this.sendDiscordMessage(webhookUrl, embed);
  }

  private async sendDiscordMessage(webhookUrl: string, embed: EmbedBuilder): Promise<void> {
    this.L.debug({ webhookUrl }, 'Sending launcher update message to webhook');
    try {
      await pRetry(
        () =>
          phin({
            method: 'POST',
            url: webhookUrl,
            data: JSON.stringify({ embeds: [embed] }),
            headers: { 'Content-Type': 'application/json' },
          }),
        {
          retries: 5,
          onFailedAttempt: (err) => this.L.debug(err),
        }
      );
    } catch (err) {
      this.L.error(err);
    }
  }

  private async getAssociatedProducts(product: IProduct): Promise<IProduct[]> {
    const associatedProductIds = new Set<number>();
    if (product.storeProduct) {
      const storeProducts: IExpandedStoreProduct[] = Object.values(product.storeProduct);
      storeProducts.forEach((storeProduct) => {
        storeProduct.associations?.forEach((id) => associatedProductIds.add(id));
        storeProduct.ownershipAssociations?.forEach((id) => associatedProductIds.add(id));
      });
    }

    this.L.debug({ associatedProductIds }, 'Looking up associated products');
    const currentProducts = await Product.find({ _id: { $in: Array.from(associatedProductIds) } });
    return currentProducts;
  }

  private getBestProductName(product: IProduct): { name?: string; altNames: string[] } {
    const allNames = [
      (product.configuration as game_configuration.Configuration)?.root?.name,
      (product.configuration as game_configuration.Configuration)?.root?.installer?.game_identifier,
      (product.configuration as game_configuration.Configuration)?.root?.sort_string,
      (product.configuration as game_configuration.Configuration)?.root?.display_name,
    ].filter((name): name is string => Boolean(name));
    this.L.trace({ allNames }, 'getting best name from all names');
    const name = allNames[0];
    const altNames = allNames.slice(1);
    return { name, altNames };
  }

  private getBestProductImageUrl(product: IProduct): string | undefined {
    const productRoot = (product.configuration as game_configuration.Configuration)?.root;
    const viableImages = [
      productRoot?.thumb_image,
      productRoot?.icon_image,
      productRoot?.splash_image,
      productRoot?.logo_image,
    ];
    this.L.trace({ viableImages }, 'getting best image from all images');

    const thumbnailFileName = viableImages.find((image) => image?.includes('.'));
    if (!thumbnailFileName) return undefined;
    return `http://static3.cdn.ubi.com/orbit/uplay_launcher_3_0/assets/${thumbnailFileName}`;
  }
}
