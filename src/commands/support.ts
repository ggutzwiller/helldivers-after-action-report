import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

const KOFI_URL = process.env.KOFI_URL;

export const data = new SlashCommandBuilder()
  .setName("support")
  .setDescription("Support the bot and keep Managed Democracy alive");

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle("Support the Super-Earth Daily News!")
    .setColor(0xffd700)
    .setDescription(
      [
        "This bot is a **volunteer** citizen effort to document the exploits of our brave Helldivers.",
        "",
        "API calls and server hosting cost a few euros per month.",
        "If you enjoy the bot, a small donation helps keep Managed Democracy running!",
        "",
        "Every contribution, no matter how small, is a victory for Super Earth.",
      ].join("\n")
    )
    .setFooter({ text: "For Managed Democracy!" })
    .setTimestamp();

  if (KOFI_URL) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Buy a Liber-tea")
        .setStyle(ButtonStyle.Link)
        .setURL(KOFI_URL)
    );
    await interaction.reply({ embeds: [embed], components: [row] });
  } else {
    await interaction.reply({ embeds: [embed] });
  }
}
