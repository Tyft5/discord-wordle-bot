import DiscordJS, { Intents, MessageEmbed } from 'discord.js'
import dotenv from 'dotenv'
dotenv.config()

const client = new DiscordJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})

let scoreboard: any = {};

client.on('ready', () => {
    loadScoreBoard();
})

const loadScoreBoard = () => {
    const fs = require('fs');
    const path = 'score.json';

    if (fs.existsSync(path)) {
        //file exists
        fs.readFile(path, (err: any, data: any) => {
            console.log('Scoreboard found - loading into memory');
            if (err) {
                throw err;
            }
            scoreboard = JSON.parse(data.toString());
            console.log(scoreboard);
            for (const id in scoreboard) {
                client.users.fetch(id)
            }
            console.log('Bot Ready!')
        });
    } else {
        console.log('No scoreboard found - creating blank scoreboard');
        writeScoreBoard();
    }
}

const writeScoreBoard = () => {
    const fs = require('fs');
    const path = 'score.json';

    fs.writeFile(path, JSON.stringify(scoreboard), (err: any) => {
        if (err) {
            throw err;
        }
        console.log('Scoreboard written to file')
    })
}

const updateScoreBoard = (userid: any, points: number) => {

    // create a new scoreboard entry
    if (!scoreboard[userid]) {
        scoreboard[userid] = points;
    } else {
        scoreboard[userid] += points;
    }

    writeScoreBoard();

    return scoreboard[userid];
}

const generateScoreBoardMessage = () => {
    // sort results
    let scoreArray = []
    for (const key in scoreboard) {
        scoreArray.push([key, scoreboard[key]]);
    }
    scoreArray = scoreArray.sort(sort2d);

    // generate reply
    let scoreReply = '';
    for (const entry of scoreArray) {
        scoreReply += `${client.users.cache.get(entry[0])}: ${entry[1]}\n`
    }

    return scoreReply;
}

const generateScoreBoardEmbed = () => {
    // sort results
    let scoreArray = []
    for (const key in scoreboard) {
        scoreArray.push([key, scoreboard[key]]);
    }
    scoreArray = scoreArray.sort(sort2d);

    // generate list of users
    let userListEmbed = '';
    for (const entry of scoreArray) {
        userListEmbed += `${client.users.cache.get(entry[0])}\n`
    }

    // generate list of scores
    let scoreListEmbed = '';
    for (const entry of scoreArray) {
        scoreListEmbed += `${entry[1]}\n`
    }

    return [userListEmbed, scoreListEmbed]
}

client.on('messageCreate', (message) => {

    // Check if admin
    const isAdmin = message.member?.permissions.has("ADMINISTRATOR");

    // Check for Wordle Score
    const wordleRegex = /Wordle \d{3} ([\dX])\/6\n{0,2}[⬛🟩🟨⬜]{5}/;
    const wordleMessage = message.content.match(wordleRegex);

    if (wordleMessage) {
        console.log(wordleMessage);
        console.log(message.author);
        // Check if X/6
        let wordleScore;

        if (wordleMessage[1] == 'X') {
            wordleScore = 0;
        } else {
            wordleScore = 7 - parseInt(wordleMessage[1]);
        }

        const updatedScore = updateScoreBoard(message.author.id, wordleScore);

        // reply with score
        message.reply({
            content: `${wordleScore} points for ${message.author} (${updatedScore} total points)`
        })

    }

    // leaderboard command
    if (message.content === '!w scores') {
        const exampleEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(':green_square: :green_square: :green_square: LEADERBOARD :green_square: :green_square: :green_square:')
            .setURL('https://www.powerlanguage.co.uk/wordle/')
            .addFields(
                { name: 'User', value: generateScoreBoardEmbed()[0], inline: true },
                { name: 'Score', value: generateScoreBoardEmbed()[1], inline: true }
            )
        message.channel.send({ embeds: [exampleEmbed] })
    }


    // admin commands 
    if (isAdmin) {

        // just debug stuff
        if (message.content === '!w debug') {
            const exampleEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(':green_square: :green_square: :green_square: NEW WORDLE CHALLENGE :green_square: :green_square: :green_square:')
                .setURL('https://www.powerlanguage.co.uk/wordle/')
                .addFields(
                    { name: 'User', value: generateScoreBoardEmbed()[0], inline: true },
                    { name: 'Score', value: generateScoreBoardEmbed()[1], inline: true }
                )
            message.channel.send({ embeds: [exampleEmbed] })
        }

        // manual update score
        if (message.content.includes('!w x')) {
            const updateRegex = /!(\d+)>([+-]\d)/
            const updateParse = message.content.match(updateRegex);

            if (updateParse) {
                console.log(updateParse);
                const userid = updateParse[1];
                const score = parseInt(updateParse[2]);
                const updatedScore = updateScoreBoard(userid, score);

                // reply with score
                message.reply({
                    content: `${score} points for ${client.users.cache.get(userid)} (${updatedScore} total points)`
                })

            }

        }

    }


})

const sort2d = (a: any, b: any) => {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] < b[1]) ? 1 : -1;
    }
}

client.login(process.env.TOKEN);