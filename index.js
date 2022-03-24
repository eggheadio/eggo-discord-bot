require('dotenv').config()
const Discord = require('discord.js')
const {Client, Intents} = require('discord.js')
const config = require('./config.json')
const {phraseFromUsername} = require('./phrases')

// Updated client to be able to apply specific permissions such as `partials: [ 'CHANNEL']` to be able to send dm's
const client = new Client({ ws: {intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES], partials: [ 'CHANNEL']} });

const libhoney = require('libhoney')
const hny = new libhoney({
  writeKey: process.env.HONEYCOMB_TOKEN || 'asf',
  dataset: 'discord',
  serviceName: 'eggo-discord-bot',
  transmission: 'writer',
})

const EGGO_BOT_ID = '417792875355701249'

function cleanEmojiDiscriminator(emojiDiscriminator) {
  var regEx = /[A-Za-z0-9_]+:[0-9]+/
  var cleaned = regEx.exec(emojiDiscriminator)
  if (cleaned) return cleaned[0]
  return emojiDiscriminator
}

client.once('ready', async () => {
  console.log('eggo is ready')
  for (var {channel, message: message_id, reactions} of config) {
    var channel = await client.channels.cache.get(channel)
    var message = await channel.messages.fetch(message_id)
    if (!message) continue
    for (var {emoji} of reactions) {
      emoji = cleanEmojiDiscriminator(emoji)
      var messageReaction = message.reactions.cache.get(emoji)
      if (!messageReaction) {
        await message.react(emoji).catch((error) => console.error(error))
      } else {
        if (!messageReaction.me) {
          messageReaction.fetchUsers()
          await message.react(emoji).catch((error) => console.error(error))
        }
      }
    }
  }
})

client.on('message', async (message) => {
  let ev = hny.newEvent()
  ev.add({eventType: 'message', authorId: message.author.id})
  if (message.author.id === EGGO_BOT_ID) {
    ev.addField('isBot', true)
    ev.send()
    return
  }

  if (message.content === '!avatar') {
    // If the message is "what is my avatar"
    // Send the user's avatar URL
    message.reply(message.author.displayAvatarURL())
    ev.addField('avatar', true)
  }

  if (message.content === '!Announcement' && message.channel.id === '810255091751845888'){
    await message.author.send('What is your announcement?')

    const filter = (m) => m.author.id === message.author.id
    const userAnnouncement = await message.author.dmChannel.awaitMessages(filter, {max: 1})
      .then((collected) => collected.first().content)
    message.channel.send(`@everyone ${userAnnouncement}`)
    message.delete()
  }

  ev.send()
})

function getEmojiDiscriminator(emoji) {
  if (emoji.id) {
    return `${emoji.name}:${emoji.id}`
  } else {
    return emoji.name
  }
}

// only works on cached messages (messages received while client open)
client.on('messageReactionAdd', async (messageReaction, user) => {
  if (user == client.user) return
  var member = await messageReaction.message.guild.members.cache.get(user.id)
  var emojiDiscriminator = getEmojiDiscriminator(messageReaction.emoji)
  for (var {channel, reactions, disjoint, intro_channel} of config) {
    if (channel != messageReaction.message.channel.id) continue
    var rolesNew = []
    var announceArrival = false
    for (var role of member.roles.cache.keys()) {
      rolesNew.push(role)
    }
    var rolesAllowList = []
    var rolesBlockList = []
    for (var {emoji, roles, announce = false} of reactions) {
      if (emojiDiscriminator == emoji) {
        announceArrival = announceArrival || announce
        rolesAllowList.push.apply(rolesAllowList, roles) //Prototyping the push function, might be buggy
      }
      rolesBlockList.push.apply(rolesBlockList, roles)
    }
    //Check to see if roles are handled mutually eclusive
    if (disjoint) {
      rolesNew = rolesNew.filter(
        (role) =>
          //Remove role if found on watchlist
          !rolesBlockList.includes(role),
      )
    }
    rolesNew.push.apply(rolesNew, rolesAllowList)
    //Make sure none of the roles on the "add" list get removed again
    await member.roles.set(rolesNew).catch((error) => console.error(error))

    if (announceArrival) {
      const phrase = phraseFromUsername(`<@${member.id}>`)
      client.channels.cache.get('754437688769249371').send(`_${phrase}_`)
    }

    if (disjoint)
      await messageReaction.remove(user).catch((error) => console.error(error))
  }
})

client.on('messageReactionRemove', async (messageReaction, user) => {
  //Bot should not react to its own reactions.
  if (user == client.user) return
  var member = await messageReaction.message.guild.members.cache.get(user.id)
  var emojiDiscriminator = getEmojiDiscriminator(messageReaction.emoji)
  ;(async () => {
    for (var {disjoint, channel, reactions} of config) {
      //Make sure we're not in "disjoint" mode
      if (disjoint) continue
      if (channel != messageReaction.message.channel.id) continue
      var rolesToKeep = []
      var rolesToRemove = []
      for (var {emoji, roles} of reactions) {
        if (emojiDiscriminator == emoji) {
          //Add to removal list
          rolesToRemove.push.apply(rolesToRemove, roles)
        } else {
          //List of all other roles that should be kept
          rolesToKeep.push.apply(rolesToKeep, roles)
        }
      }
      rolesToRemove.filter(
        (role) =>
          //Make sure role that is about to be removed is not part of another emoji
          !rolesToKeep.includes(role) &&
          //Make sure member actually has role
          member.roles.cache.get(role),
      )
      await member.roles
        .remove(rolesToRemove)
        .catch((error) => console.error(error))
    }
  })()
})

// https://discordapp.com/channels/365559264850477066/715004775300726825/715013654575054898
hny.sendNow({booting: true})
client.login(process.env.BOT_TOKEN)
