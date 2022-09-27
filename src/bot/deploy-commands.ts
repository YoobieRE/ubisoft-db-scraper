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
  .setDescription('Get the raw store product data for a product ID')
  .addIntegerOption((opt) =>
    opt.setName('product-id').setDescription('ID number for the product').setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName('type')
      .setDescription(`Store type to query ('upsell' or 'ingame')`)
      .setChoices({ name: 'Ingame', value: 'ingame' }, { name: 'Upsell', value: 'upsell' })
      .setRequired(true)
  );

export const commands = [configCommand, manifestCommand, storeCommand].map((c) => c.toJSON());
