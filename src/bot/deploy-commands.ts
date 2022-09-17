import { SlashCommandBuilder } from '@discordjs/builders';

export const configCommand = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Get the raw config data for a product')
  .addIntegerOption((opt) =>
    opt.setName('product-id').setDescription('ID number for the product').setRequired(true)
  );

export const manifestCommand = new SlashCommandBuilder()
  .setName('manifest')
  .setDescription('Decode a uplay_install.manifest file to JSON')
  .addAttachmentOption((opt) =>
    opt.setName('manifest').setDescription('Attach a uplay_install.manifest file').setRequired(true)
  );

export const storeCommand = new SlashCommandBuilder()
  .setName('store')
  .setDescription('Listen and log any push events for the store service connection');

export const commands = [configCommand, manifestCommand, storeCommand].map((c) => c.toJSON());
