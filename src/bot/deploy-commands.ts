import { SlashCommandBuilder } from '@discordjs/builders';

export const configCommand = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Get the raw config data for a product')
  .addIntegerOption((opt) =>
    opt.setName('product-id').setDescription('ID number for the product').setRequired(true)
  );

export const commands = [configCommand].map((c) => c.toJSON());
