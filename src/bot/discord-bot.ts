import { Logger } from 'pino';
import Discord from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import {
  game_configuration,
  ownership_service,
  store_service,
  UbisoftDemux,
  UbisoftFileParser,
} from 'ubisoft-demux';
import yaml from 'yaml';
import phin from 'phin';
import { commands, configCommand, manifestCommand, storeCommand } from './deploy-commands';
import { Account } from '../common/config';
import { UbiTicketManager } from '../demux/ticket-manager';
import { IExpandedStoreProduct } from '../schema/product';

export interface DiscordBotBuilderProps {
  botToken: string;
  ubiAccount: Account;
  logger: Logger;
  testGuildId?: string;
}

export interface DiscordBotProps extends DiscordBotBuilderProps {
  client: Discord.Client<true>;
}

export class DiscordBot {
  static async build(props: DiscordBotBuilderProps): Promise<DiscordBot> {
    const L = props.logger;
    const client = new Discord.Client<true>({
      failIfNotExists: false,
      intents: [Discord.GatewayIntentBits.Guilds],
      presence: {
        activities: [
          {
            type: Discord.ActivityType.Playing,
            name: 'Ubisoft Connect',
          },
        ],
      },
    });
    await client.login(props.botToken);
    L.info('Discord bot logged in');
    const inviteUrl = client.generateInvite({
      scopes: [Discord.OAuth2Scopes.Bot, Discord.OAuth2Scopes.ApplicationsCommands],
      permissions: [
        Discord.PermissionFlagsBits.ViewChannel,
        Discord.PermissionFlagsBits.SendMessages,
        Discord.PermissionFlagsBits.AttachFiles,
      ],
    });
    L.info({ inviteUrl }, 'Discord bot invite URL');

    const rest = new REST({ version: '10' }).setToken(props.botToken);
    const commandPath = props.testGuildId
      ? Routes.applicationGuildCommands(client.user.id, props.testGuildId)
      : Routes.applicationCommands(client.user.id);
    await rest.put(commandPath, { body: commands });
    L.debug('Deployed Discord commands');

    return new DiscordBot({ ...props, client });
  }

  private L: Logger;

  public client: Discord.Client<true>;

  private ticketManager: UbiTicketManager;

  constructor(props: DiscordBotProps) {
    this.L = props.logger;
    this.client = props.client;
    this.ticketManager = new UbiTicketManager({ logger: this.L, account: props.ubiAccount });

    this.client.on('interactionCreate', this.handleInteraction.bind(this));
  }

  private async handleInteraction(interaction: Discord.Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    this.L.info(
      { commandName: interaction.commandName, options: interaction.options.data },
      'Received interaction'
    );
    if (interaction.commandName === configCommand.name) {
      await this.configCommand(interaction);
    }
    if (interaction.commandName === manifestCommand.name) {
      await this.manifestCommand(interaction);
    }
    if (interaction.commandName === storeCommand.name) {
      await this.storeCommand(interaction);
    }
  }

  private async storeCommand(interaction: Discord.ChatInputCommandInteraction): Promise<void> {
    const productId = interaction.options.getInteger('product-id', true);
    const storeTypeName = interaction.options.getString('type', true);
    const storeTypeMap: Record<string, store_service.StoreType> = {
      ingame: store_service.StoreType.StoreType_Ingame,
      upsell: store_service.StoreType.StoreType_Upsell,
    };
    const storeType = storeTypeMap[storeTypeName];

    const demux = new UbisoftDemux({ timeout: 2500 }); // Shorter than 3 second Discord timeout
    try {
      await demux.basicRequest({
        authenticateReq: {
          clientId: 'uplay_pc',
          sendKeepAlive: false,
          token: {
            ubiTicket: await this.ticketManager.getTicket(),
          },
        },
      });
      this.L.debug('Starting store service connection');
      const storeConnection = await demux.openConnection('store_service');
      await storeConnection.request({
        request: {
          requestId: 1,
          initializeReq: {
            protoVersion: 7,
            useStaging: false,
          },
        },
      });
      const storeDataResp = await storeConnection.request({
        request: {
          requestId: 1,
          getDataReq: {
            storeDataType: storeType,
            productId: [productId],
          },
        },
      });
      const productList: IExpandedStoreProduct[] =
        storeDataResp.toJSON().response?.getDataRsp?.products || [];
      const requestedProduct = productList.find((p) => p.productId === productId);
      if (requestedProduct) {
        if (requestedProduct.configuration) {
          requestedProduct.configuration = JSON.parse(
            Buffer.from(requestedProduct.configuration as string, 'base64').toString('utf8')
          );
        }
        requestedProduct.associations?.sort((a, b) => a - b);
        requestedProduct.ownershipAssociations?.sort((a, b) => a - b);
        let productJson = JSON.stringify(requestedProduct, null, 2);
        if (productJson.length > 8 * 1024 * 1024) {
          // If greater than 8MiB, remove the formatting and try that
          productJson = JSON.stringify(requestedProduct);
        }
        const attachmentFile = new Discord.AttachmentBuilder(Buffer.from(productJson, 'utf-8'), {
          name: `store-${storeTypeName}-${productId}.json`,
        });
        await interaction.reply({
          content: `Store ${storeTypeName} product for product ID ${productId}:`,
          files: [attachmentFile],
        });
        return;
      }

      await interaction.reply(`Store ${storeTypeName} product for ID ${productId} does not exist`);
    } catch (err) {
      this.L.error(err);
      await demux.destroy();
    }
  }

  private async configCommand(interaction: Discord.ChatInputCommandInteraction): Promise<void> {
    const productId = interaction.options.getInteger('product-id', true);
    const demux = new UbisoftDemux({ timeout: 2500 }); // Shorter than 3 second Discord timeout

    try {
      await demux.basicRequest({
        authenticateReq: {
          clientId: 'uplay_pc',
          sendKeepAlive: false,
          token: {
            ubiTicket: await this.ticketManager.getTicket(),
          },
        },
      });
      const ownershipConnection = await demux.openConnection('ownership_service');
      await ownershipConnection.request({
        request: {
          requestId: 1,
          initializeReq: {
            getAssociations: false,
            protoVersion: 7,
            useStaging: false,
          },
        },
      });
      const configResp = await ownershipConnection.request({
        request: {
          requestId: 1,
          getProductConfigReq: {
            deprecatedTestConfig: false,
            productId,
          },
        },
      });

      const configuration = configResp.response?.getProductConfigRsp?.configuration;

      if (
        configResp.response?.getProductConfigRsp?.result !==
          ownership_service.GetProductConfigRsp_Result.Result_Success ||
        !configuration
      ) {
        await interaction.reply(`Configuration for product ID ${productId} does not exist`);
        return;
      }

      let configStringified: string;
      let filename: string;
      try {
        const configParsed: game_configuration.Configuration = yaml.parse(configuration, {
          uniqueKeys: false,
          strict: false,
        });
        configStringified = JSON.stringify(configParsed, null, 2);
        filename = `config-${productId}.json`;
      } catch (err) {
        if (err.name !== 'YAMLParseError') throw err;
        // Ubisoft's YAML can have syntax errors (see 1483). If so, we just store it as a string
        configStringified = configuration;
        filename = `config-${productId}.yaml`;
      }
      const configFile = new Discord.AttachmentBuilder(Buffer.from(configStringified, 'utf-8'), {
        name: filename,
      });
      await interaction.reply({
        content: `Configuration for product ID ${productId}:`,
        files: [configFile],
      });
    } catch (err) {
      this.L.error(err);
    }
    await demux.destroy();
  }

  private async manifestCommand(interaction: Discord.ChatInputCommandInteraction): Promise<void> {
    try {
      const manifestAttachment = interaction.options.getAttachment('manifest', true);
      const attachmentUrl = manifestAttachment.attachment.toString();
      const resp = await phin(attachmentUrl);
      const manifestBin = resp.body;
      const fileParser = new UbisoftFileParser();
      const decodedManifest = fileParser.parseDownloadManifest(manifestBin);
      let manifestJson = JSON.stringify(decodedManifest, null, 2);
      if (manifestJson.length > 8 * 1024 * 1024) {
        // If greater than 8MiB, remove the formatting and try that
        manifestJson = JSON.stringify(decodedManifest);
      }
      const configFile = new Discord.AttachmentBuilder(Buffer.from(manifestJson, 'utf-8'), {
        name: `${manifestAttachment.name}.json`,
      });
      await interaction.reply({
        content: `Decoded manifest:`,
        files: [configFile],
      });
    } catch (err) {
      this.L.error(err);
      await interaction.reply('Error parsing manifest');
    }
  }
}
