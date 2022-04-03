import { Client, Guild, GuildMember, Intents, TextChannel, VoiceChannel } from 'discord.js'
import { config } from 'dotenv'
config()

const consts = {
    GUILD_ID: '265182824082964480',
    START_HERE_ID: '718626372582506616',
    COMMANDS_CHANNEL_ID: '718834639392997497',
    roles: [
        {
            // league of legends
            name: 'League of Legends',
            roleID: '778078392830001182',
            messageID: '778760999960051762',
            reactionID: '778310721557495859',
        },
        {
            // minecraft
            name: 'Minecraft',
            roleID: '778078392830001182',
            messageID: '778760999960051762',
            reactionID: '778310721557495859',
        },
        {
            // amongus
            name: 'Among Us',
            roleID: '778696375407607838',
            messageID: '778761100635930626',
            reactionID: '778306912886325289',
        },
        {
            // dead by daylight
            name: 'Dead by Daylight',
            roleID: '778079635031851058',
            messageID: '778760999960051762',
            reactionID: '778307149519519754',
        },
    ],
    leagueVoiceChannels: [
        '778099342984216606',
        '778099642663567371',
    ]
}

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
})

let guild: Guild | null = null

function addRole(role: typeof consts.roles[number], member: GuildMember) {
    if (member && !member.roles.cache.has(role.roleID)) {
        member.roles.add(role.roleID)
        console.log(`Added ${role.name} role to ${member.user.username}`)
    }
}

client.on('ready', async () => {
    const guilds = await client.guilds.fetch()
    guild = await guilds.get(consts.GUILD_ID)?.fetch() ?? null

    refreshRoles()
    setInterval(() => {
        // refresh every 10 minutes
        console.log('Refreshing roles')
        refreshRoles()
    }, 1000 * 60 * 10)
})

async function refreshRoles() {
    if (!guild) return
    const channel = await client.channels.fetch(consts.START_HERE_ID) as TextChannel
    const messages = await channel.messages.fetch() // this will cache the messages

    for (const game of consts.roles) {
        console.log(`Checking all users for ${game.name}`)
        const message = messages.get(game.messageID)
        const reaction = message?.reactions.cache.get(game.reactionID)
        const users = await reaction?.users.fetch()

        users?.filter(user => !user.bot).forEach(user => {
            const member = guild?.members.cache.get(user.id)
            if (member && !member.roles.cache.has(game.roleID)) {
                member.roles.add(game.roleID)
                console.log(`Added ${game.name} role to ${user.username} while refreshing roles`)
            }
        })
    }
}

// listen for commands
client.on('messageCreate', async message => {
    if (message.author.bot) return
    if (!message.member) return
    if (message.guild?.id !== consts.GUILD_ID) return
    if (message.channel.id !== consts.COMMANDS_CHANNEL_ID) return

    setTimeout(() => {
        if (message.deletable) message.delete()
    }, 1000 * 60 * 5)

    if (!message.content.startsWith('!')) return
    const command = message.content.split(' ')[0].substring(1)
    const args = message.content.split(' ').slice(1)
    switch (command) {
        case '3v3':
            // return if member is not in a voice channel
            if (!message.member.voice.channel) return
            // get number of users in voice channel
            let users = message.member.voice.channel.members.toJSON()
            users = users.sort(() => Math.random() - 0.5)

            // split users into 2 teams
            const team1 = users.slice(0, Math.ceil(users.length / 2))
            const team2 = users.slice(Math.ceil(users.length / 2))

            // move team 1 to voice channel 1
            const channel1 = await message.guild?.channels.fetch(consts.leagueVoiceChannels[0]) as VoiceChannel
            for (const member of team1) {
                await member.voice.setChannel(channel1)
            }

            // move team 2 to voice channel 2
            const channel2 = await message.guild?.channels.fetch(consts.leagueVoiceChannels[1]) as VoiceChannel
            for (const member of team2) {
                await member.voice.setChannel(channel2)
            }
            break

        default:
            message.channel.send(`Unknown command: ${command}`)
            break
    }
})

client.on('messageReactionAdd', async (reaction, user) => {
    // return if the user is a bot
    if (user.bot) return
    // return if the channel is not the start here channel
    if (reaction.message.channel.id !== consts.START_HERE_ID) return
    const role = consts.roles.find(r => r.reactionID === reaction.emoji.id)
    if (!role) return
    // add the role to the user
    const member = await reaction.message.guild?.members.fetch({ user: user.id })
    if (member && !member.roles.cache.has(role.roleID)) {
        await member.roles.add(role.roleID)
        console.log(`Added ${role.name} role to ${user.username}`)
    }
})

client.on('messageReactionRemove', async (reaction, user) => {
    // return if the user is a bot
    if (user.bot) return
    // return if the channel is not the start here channel
    if (reaction.message.channel.id !== consts.START_HERE_ID) return
    const role = consts.roles.find(r => r.reactionID === reaction.emoji.id)
    if (!role) return
    // remove the role from the user
    const member = await reaction.message.guild?.members.fetch({ user: user.id })
    if (member && member.roles.cache.has(role.roleID)) {
        await member.roles.remove(role.roleID)
        console.log(`Removed ${role.name} role from ${user.username}`)
    }
})

client.login(process.env.TOKEN)