import "dotenv/config";
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  type ChatInputCommandInteraction,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import * as aboutCommand from "./commands/about.js";
import * as reportCommand from "./commands/report.js";
import * as statsCommand from "./commands/stats.js";
import * as supportCommand from "./commands/support.js";
import * as usageCommand from "./commands/usage.js";

interface Command {
  data: { name: string; toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

// Public commands — registered globally, available on all servers
const publicCommands = new Collection<string, Command>();
publicCommands.set(aboutCommand.data.name, aboutCommand);
publicCommands.set(reportCommand.data.name, reportCommand);
publicCommands.set(statsCommand.data.name, statsCommand);
publicCommands.set(supportCommand.data.name, supportCommand);

// Admin commands — registered only on the admin guild
const adminCommands = new Collection<string, Command>();
adminCommands.set(usageCommand.data.name, usageCommand);

// Merged collection for the interaction handler
const allCommands = new Collection<string, Command>();
publicCommands.forEach((cmd, name) => allCommands.set(name, cmd));
adminCommands.forEach((cmd, name) => allCommands.set(name, cmd));

const ADMIN_GUILD_ID = process.env.ADMIN_GUILD_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Register slash commands on startup
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Bot logged in as ${readyClient.user.tag}`);

  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
  const clientId = process.env.DISCORD_CLIENT_ID!;

  // Register public commands globally
  const publicData = publicCommands.map((cmd) => cmd.data.toJSON());
  await rest.put(Routes.applicationCommands(clientId), { body: publicData });
  console.log(`${publicData.length} global commands registered.`);

  // Register admin commands on the admin guild only
  if (ADMIN_GUILD_ID) {
    const adminData = adminCommands.map((cmd) => cmd.data.toJSON());
    await rest.put(Routes.applicationGuildCommands(clientId, ADMIN_GUILD_ID), {
      body: adminData,
    });
    console.log(`${adminData.length} admin commands registered on guild ${ADMIN_GUILD_ID}.`);
  } else {
    console.warn(
      "[Config] ADMIN_GUILD_ID not set — /usage will not be available. Set it in .env to enable admin commands."
    );
  }
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = allCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error in /${interaction.commandName}:`, error);
    const reply = {
      content: "An error occurred.",
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
