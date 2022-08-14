import { EmbedBuilder } from '@discordjs/builders';
import type { APIEmbedThumbnail } from 'discord-api-types/v10';
import { diffString } from 'json-diff';
import mongoose from 'mongoose';
import phin from 'phin';
import { Logger } from 'pino';
import { game_configuration } from 'ubisoft-demux';
import { ProductDocument } from '../schema/product';

export interface DiscordChannelWebhookList {
  default: string;
  [productId: string]: string;
}

export interface DiscordReporterProps {
  channelWebhooks: DiscordChannelWebhookList;
  logger: Logger;
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

  private author = 'YoobieTracker';

  private authorIcon = 'https://avatars.githubusercontent.com/u/110780530';

  private authorUrl = 'https://github.com/YoobieTracker';

  private L: Logger;

  constructor(props: DiscordReporterProps) {
    if (!props.channelWebhooks.default)
      throw new Error('Discord webhook list must have a "default" webhook');
    this.defaultWebhook = props.channelWebhooks.default;
    this.channelWebhooks = new Map(Object.entries(props.channelWebhooks));
    this.L = props.logger;
  }

  public async sendProductUpdates(
    newProduct: ProductDocument,
    oldProduct?: ProductDocument
  ): Promise<void> {
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

    const productRoot = (cleanNewProduct.configuration as game_configuration.Configuration)?.root;
    const viableImages = [
      productRoot?.thumb_image,
      productRoot?.icon_image,
      productRoot?.splash_image,
      productRoot?.logo_image,
    ];
    const thumbnailFileName = viableImages.find((image) => image?.includes('.'));
    let thumbnailEmbed: APIEmbedThumbnail | undefined;
    if (thumbnailFileName) {
      thumbnailEmbed = {
        url: `http://static3.cdn.ubi.com/orbit/uplay_launcher_3_0/assets/${thumbnailFileName}`,
      };
    }

    const embed = new EmbedBuilder({
      author: {
        name: this.author,
        icon_url: this.authorIcon,
        url: this.authorUrl,
      },
      title:
        (cleanNewProduct.configuration as game_configuration.Configuration)?.root?.name ||
        undefined,
      thumbnail: thumbnailEmbed,
      description,
      color,
      fields: [{ name: 'Changes', value: changes }],
    });

    const webhookUrl = this.channelWebhooks.get(productId.toString()) || this.defaultWebhook;

    this.L.debug({ webhookUrl, productId }, 'Sending product update message to webhook');
    try {
      await phin({
        method: 'POST',
        url: webhookUrl,
        data: JSON.stringify({ embeds: [embed] }),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      this.L.error(err);
    }
  }
}
