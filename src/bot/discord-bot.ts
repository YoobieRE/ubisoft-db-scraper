import { Logger } from 'pino';
import Discord from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { game_configuration, ownership_service, UbisoftDemux } from 'ubisoft-demux';
import yaml from 'yaml';
import { commands } from './deploy-commands';
import { Account } from '../common/config';
import { UbiTicketManager } from '../demux/ticket-manager';

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

  private client: Discord.Client<true>;

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
    if (interaction.commandName === 'config') {
      await this.configCommand(interaction);
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
}
