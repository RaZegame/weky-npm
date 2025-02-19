const currentGames = new Object();
const Discord = require('discord.js');
const disbut = require('discord-buttons');
const {
	convertTime,
	shuffleArray,
	randomHexColor,
	checkForUpdates,
} = require('../functions/function');

module.exports = async (options) => {
	checkForUpdates();
	if (!options.message) {
		throw new Error('Weky Error: message argument was not specified.');
	}
	if (typeof options.message !== 'object') {
		throw new TypeError('Weky Error: Invalid Discord Message was provided.');
	}

	if (!options.embed) options.embed = {};
	if (typeof options.embed !== 'object') {
		throw new TypeError('Weky Error: embed must be an object.');
	}

	if (!options.embed.title) {
		options.embed.title = 'Quick Click | Weky Development';
	}
	if (typeof options.embed.title !== 'string') {
		throw new TypeError('Weky Error: embed title must be a string.');
	}

	if (!options.embed.color) options.embed.color = randomHexColor();
	if (typeof options.embed.color !== 'string') {
		throw new TypeError('Weky Error: embed color must be a string.');
	}

	if (!options.embed.timestamp) options.embed.timestamp = true;
	if (typeof options.embed.timestamp !== 'boolean') {
		throw new TypeError('Weky Error: timestamp must be a boolean.');
	}

	if (!options.time) options.time = 60000;
	if (parseInt(options.time) < 10000) {
		throw new Error(
			'Weky Error: time argument must be greater than 10 Seconds (in ms i.e. 10000).',
		);
	}
	if (typeof options.time !== 'number') {
		throw new TypeError('Weky Error: time must be a number.');
	}

	if (!options.waitMessage) {
		options.waitMessage = 'The buttons may appear anytime now!';
	}
	if (typeof options.waitMessage !== 'string') {
		throw new TypeError('Weky Error: waitMessage must be a string.');
	}

	if (!options.startMessage) {
		options.startMessage =
			'First person to press the correct button will win. You have **{{time}}**!';
	}
	if (typeof options.startMessage !== 'string') {
		throw new TypeError('Weky Error: startMessage must be a string.');
	}

	if (!options.winMessage) {
		options.winMessage =
			'GG, <@{{winner}}> pressed the button in **{{time}} seconds**.';
	}
	if (typeof options.winMessage !== 'string') {
		throw new TypeError('Weky Error: startMessage must be a string.');
	}

	if (!options.loseMessage) {
		options.loseMessage =
			'No one pressed the button in time. So, I dropped the game!';
	}
	if (typeof options.loseMessage !== 'string') {
		throw new TypeError('Weky Error: startMessage must be a string.');
	}

	if (!options.emoji) options.emoji = '👆';
	if (typeof options.emoji !== 'string') {
		throw new TypeError('Weky Error: emoji must be a string.');
	}

	if (!options.ongoingMessage) {
		options.ongoingMessage =
			'A game is already runnning in <#{{channel}}>. You can\'t start a new one!';
	}
	if (typeof options.ongoingMessage !== 'string') {
		throw new TypeError('Weky Error: ongoingMessage must be a string.');
	}

	if (currentGames[options.message.guild.id]) {
		const embed = new Discord.MessageEmbed()
			.setTitle(options.embed.title)
			.setColor(options.embed.color)
			
			.setDescription(
				options.ongoingMessage.replace(
					'{{channel}}',
					currentGames[`${options.message.guild.id}_channel`],
				),
			);
		if (options.embed.timestamp) {
			embed.setTimestamp();
		}
		return options.message.channel.send(embed);
	}
	const embed = new Discord.MessageEmbed()
		.setTitle(options.embed.title)
		.setColor(options.embed.color)
		
		.setDescription(options.waitMessage);
	if (options.embed.timestamp) {
		embed.setTimestamp();
	}
	options.message.channel.send(embed).then((msg) => {
		currentGames[options.message.guild.id] = true;
		currentGames[`${options.message.guild.id}_channel`] =
			options.message.channel.id;
		setTimeout(async function() {
			const gameCreatedAt = Date.now();
			const buttons = [];
			const rows = [];
			for (let i = 0; i < 24; i++) {
				buttons.push(
					new disbut.MessageButton()
						.setDisabled()
						.setLabel('\u200b')
						.setStyle('blurple')
						.setID('INCORRECT'),
				);
			}
			buttons.push(
				new disbut.MessageButton()
					.setStyle('blurple')
					.setEmoji(options.emoji)
					.setID('CORRECT'),
			);
			shuffleArray(buttons);
			for (let i = 0; i < Math.ceil(25 / 5); i++) {
				rows.push(new disbut.MessageActionRow());
			}
			rows.forEach((row, i) => {
				row.addComponents(buttons.slice(0 + i * 5, 5 + i * 5));
			});
			const _embed = new Discord.MessageEmbed()
				.setTitle(options.embed.title)
				.setColor(options.embed.color)
				
				.setDescription(
					options.startMessage.replace('{{time}}', convertTime(options.time)),
				);
			if (options.embed.timestamp) {
				_embed.setTimestamp();
			}
			await msg.edit({
				embed: _embed,
				components: rows,
			});
			const Collector = await msg.createButtonCollector((fn) => fn, {
				time: options.time,
			});
			Collector.on('collect', async (button) => {
				if (button.id === 'CORRECT') {
					button.reply.defer();
					Collector.stop();
					buttons.forEach((element) => {
						element.setDisabled();
					});
					rows.length = 0;
					for (let i = 0; i < Math.ceil(25 / 5); i++) {
						rows.push(new disbut.MessageActionRow());
					}
					rows.forEach((row, i) => {
						row.addComponents(buttons.slice(0 + i * 5, 5 + i * 5));
					});
					const __embed = new Discord.MessageEmbed()
						.setTitle(options.embed.title)
						.setDescription(
							options.winMessage
								.replace('{{winner}}', button.clicker.user.id)
								.replace('{{time}}', (Date.now() - gameCreatedAt) / 1000),
						)
						.setColor(options.embed.color)
						
					if (options.embed.timestamp) {
						__embed.setTimestamp();
					}
					await msg.edit({
						embed: __embed,
						components: rows,
					});
				}
				return delete currentGames[options.message.guild.id];
			});
			Collector.on('end', async (_msg, reason) => {
				if (reason === 'time') {
					buttons.forEach((element) => {
						element.setDisabled();
					});
					rows.length = 0;
					for (let i = 0; i < Math.ceil(25 / 5); i++) {
						rows.push(new disbut.MessageActionRow());
					}
					rows.forEach((row, i) => {
						row.addComponents(buttons.slice(0 + i * 5, 5 + i * 5));
					});
					const __embed = new Discord.MessageEmbed()
						.setTitle(options.embed.title)
						.setColor(options.embed.color)
						
						.setDescription(options.loseMessage);
					if (options.embed.timestamp) {
						__embed.setTimestamp();
					}
					await msg.edit({
						embed: __embed,
						components: rows,
					});
					return delete currentGames[options.message.guild.id];
				}
			});
		}, Math.floor(Math.random() * 5000) + 1000);
	});
};
