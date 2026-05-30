console.log("EDELWEISS BOT STARTET...");

const fs = require("fs");
const path = require("path");

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});


// 🔐 SETTINGS
const LAGER_CHANNEL_ID = "1506612238935527460";
const LOG_CHANNEL_ID = "1506612237660590241";


// 👑 4 VIEW ROLES (Edelweiß)
const VIEW_ROLES = [
  "1506612236444110947",
  "1506612236444110946",
  "1506612236444110945",
  "1506612236372672549"
];


// 📦 SAFE FILE PATH
const LAGER_FILE = path.join(__dirname, "lager.json");

let lager = fs.existsSync(LAGER_FILE)
  ? JSON.parse(fs.readFileSync(LAGER_FILE, "utf8"))
  : {};

function save() {
  fs.writeFileSync(LAGER_FILE, JSON.stringify(lager, null, 2));
}


// 🧠 ROLE CHECK
function hasRole(member, roles) {
  return roles.some(r => member.roles.cache.has(r));
}


// 🔥 LOG SYSTEM
async function sendLog(member, action, item, amount) {
  try {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle("❄ Edelweiß Lager Log")
      .setColor(0x99ccff)
      .setThumbnail(member.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "👤 Spieler", value: member.displayName, inline: true },
        { name: "⚡ Aktion", value: action, inline: true },
        { name: "📦 Item", value: item, inline: true },
        { name: "🔢 Menge", value: String(amount), inline: true }
      )
      .setTimestamp();

    channel.send({ embeds: [embed] });

  } catch (err) {
    console.log("LOG ERROR:", err);
  }
}


// 📊 EMBED
function lagerEmbed() {
  let text = Object.entries(lager)
    .map(([item, count]) => `📦 **${item}**: ${count}`)
    .join("\n");

  if (!text) text = "📭 Lager ist leer";

  return new EmbedBuilder()
    .setTitle("❄ Edelweiß LagerSystem")
    .setColor(0x99ccff)
    .setDescription(text)
    .setFooter({ text: "Edelweiß RP System" });
}


// 🔘 BUTTONS
function lagerButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("einlagern")
      .setLabel("➕ Einlagern")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("auslagern")
      .setLabel("➖ Auslagern")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId("bestand")
      .setLabel("📊 Bestand (Boss)")
      .setStyle(ButtonStyle.Primary)
  );
}


// 🧠 MODAL
function createModal(type) {
  const modal = new ModalBuilder()
    .setCustomId(type)
    .setTitle(type === "einlagern_modal" ? "Einlagern" : "Auslagern");

  const itemInput = new TextInputBuilder()
    .setCustomId("item")
    .setLabel("Item Name")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const amountInput = new TextInputBuilder()
    .setCustomId("amount")
    .setLabel("Menge")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(itemInput),
    new ActionRowBuilder().addComponents(amountInput)
  );

  return modal;
}


// 🚀 READY
client.on("ready", () => {
  console.log(`✅ Eingeloggt als ${client.user.tag}`);
});


// 📦 COMMAND
client.on("messageCreate", (message) => {

  if (message.author.bot) return;
  if (!message.guild) return;

  if (message.content !== "!lager") return;
  if (message.channel.id !== LAGER_CHANNEL_ID) return;

  const panel = new EmbedBuilder()
    .setTitle("❄ Edelweiß LagerSystem")
    .setColor(0x99ccff)
    .setDescription("📦 Nutze die Buttons um das Lager zu verwalten");

  message.channel.send({
    embeds: [panel],
    components: [lagerButtons()]
  });
});


// 🔥 INTERACTION HANDLER (GLEICH WIE AVERNO)
client.on("interactionCreate", async (interaction) => {

  if (interaction.isButton()) {

    if (interaction.customId === "einlagern") {
      return interaction.showModal(createModal("einlagern_modal"));
    }

    if (interaction.customId === "auslagern") {
      return interaction.showModal(createModal("auslagern_modal"));
    }

    if (interaction.customId === "bestand") {

      if (!hasRole(interaction.member, VIEW_ROLES)) {
        return interaction.reply({
          content: "❌ Kein Zugriff",
          flags: 64
        });
      }

      return interaction.reply({
        embeds: [lagerEmbed()],
        flags: 64
      });
    }
  }

  if (interaction.isModalSubmit()) {

    const item = interaction.fields.getTextInputValue("item");
    const amount = parseInt(interaction.fields.getTextInputValue("amount"));

    if (!item || isNaN(amount)) {
      return interaction.reply({
        content: "❌ Ungültige Eingabe",
        flags: 64
      });
    }

    if (!lager[item]) lager[item] = 0;

    // ➕ EINLAGERN
    if (interaction.customId === "einlagern_modal") {
      lager[item] += amount;
      save();

      await sendLog(interaction.member, "EINLAGERN", item, amount);

      return interaction.reply({
        content: `➕ ${amount} ${item} eingelagert`,
        flags: 64
      });
    }

    // ➖ AUSLAGERN
    if (interaction.customId === "auslagern_modal") {
      lager[item] = Math.max((lager[item] || 0) - amount, 0);
      save();

      await sendLog(interaction.member, "AUSLAGERN", item, amount);

      return interaction.reply({
        content: `➖ ${amount} ${item} ausgelagert`,
        flags: 64
      });
    }
  }
});


// 🔑 LOGIN
client.login(process.env.TOKEN);