import { SlashCommandBuilder } from '@discordjs/builders';
import { PermissionsBitField } from 'discord.js';

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
  .setDescription('Listen and log any push events for the store service connection')
  .setDefaultMemberPermissions(PermissionsBitField.resolve('Administrator'));

export const commands = [configCommand, manifestCommand].map((c) => c.toJSON());
