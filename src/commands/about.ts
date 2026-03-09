import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("about")
  .setDescription("About this bot, privacy policy, and how it works");

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=2147485696&scope=bot+applications.commands`;

  const embed = new EmbedBuilder()
    .setTitle("About the Super-Earth Daily News Bot")
    .setColor(0x5865f2)
    .setDescription(
      "Analyzes Helldivers 2 end-of-mission screenshots and generates lore-flavored after-action reports in 5 different writing styles."
    )
    .addFields(
      {
        name: "How it works",
        value: [
          "1. You upload a screenshot with `/report`",
          "2. The image is sent to the **Mistral AI** vision API for stats extraction",
          "3. A second AI call generates the narrative in your chosen style",
          "4. The report is saved and displayed as a Discord embed",
        ].join("\n"),
        inline: false,
      },
      {
        name: "Privacy & data",
        value: [
          "- **Images** are sent to the Mistral AI API for analysis. They are not stored by this bot.",
          "- **Player stats** (kills, deaths, samples, etc.) extracted from screenshots are stored to power the `/stats` command.",
          "- **Discord user ID and username** are stored to link reports to players.",
          "- No other personal data is collected.",
          "- The bot currently uses Mistral's **Experiment plan**: API requests may be used by Mistral to improve their models.",
          "- With enough donations via `/support`, we will upgrade to a **paid plan** where your data is **no longer used for training**.",
        ].join("\n"),
        inline: false,
      },
      {
        name: "Invite this bot",
        value: `[Add to your server](${inviteUrl})`,
        inline: true,
      },
      {
        name: "Support",
        value: "Use `/support` to help keep the bot running!",
        inline: true,
      },
    )
    .setFooter({ text: "For Managed Democracy!" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
