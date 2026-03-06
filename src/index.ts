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
import * as reportCommand from "./commands/report.js";
import * as statsCommand from "./commands/stats.js";
import * as usageCommand from "./commands/usage.js";

interface Command {
  data: { name: string; toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commands = new Collection<string, Command>();
commands.set(reportCommand.data.name, reportCommand);
commands.set(statsCommand.data.name, statsCommand);
commands.set(usageCommand.data.name, usageCommand);

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Register slash commands on startup
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Bot logged in as ${readyClient.user.tag}`);

  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
  const commandData = commands.map((cmd) => cmd.data.toJSON());

  await rest.put(
    Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
    { body: commandData }
  );

  console.log(`${commandData.length} commands registered.`);
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
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
