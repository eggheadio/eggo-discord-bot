# Bot for egghead Discord

This is a bot for egghead's Discord.

It utilizes `discord.js` and runs on Node.js. 

The bot is deployed on Heroku.

For local development you will need to set a `BOT_TOKEN` in a `.env` file. A template is provided.

## Reaction Roles

This bot allows the configuration of **reaction roles**. This means that we can pre-define a message and if a user clicks a particular reaction they are assigned a role. This is useful for a Code of Conduct for new members as a way of "signing" that they have read and understand the CoC.

The `config.json` file is used to configure the reaction roles:

```json
[
  {
    "message": "715018713383829625",
    "channel": "715004775300726825",
    "disjoint": false,
    "reactions": [
      {
        "emoji": "🤔",
        "roles": ["715015248742187058"]
      }
    ]
  }
]
```

Finding the IDs you need is a lot easier if you turn on developer mode in Discord which can be found in your user settings.

One thing to note is that if a message already exists it needs to be loaded by the bot explicitly. The bot is only implicitly aware of new messages that come in while the bot is running. Existing messages must be retrieved from the cache for this to function as expected.

## Resources

[v11 -> v12 changes](https://discordjs.guide/additional-info/changes-in-v12.html) were a significant issue making this bot function as they had major API changes between these versions.

[discord.js event cheatsheet](https://gist.github.com/koad/316b265a91d933fd1b62dddfcc3ff584) is useful for seeing all the events in one place

[discord-js-bot-guide](https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/SUMMARY.md)

[Discord-EmojiToRole](https://github.com/NKN1396/Discord-EmojiToRole) had a lot of initial code that was clipped to get this running. It wasn't written for v12, but logically it is pretty solid.

[Deploy your bot to Heroku](https://shiffman.net/a2z/bot-heroku/) Daniel Shiffman has an awesome tutorial