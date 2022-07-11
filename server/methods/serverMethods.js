import GameManager from '../imports/GameManager';
import {Games, Lobbies, Categories} from '../../imports/collections';

standardMethodChecks = (gameId, userId, phase, inputRequired, inputString) => {
    if (inputRequired) {
        check(inputString, String);
        if (inputString.length < 1 || inputString.length > 300)
            throw new Meteor.Error('invalid-input', 'Provided input is too long or too short');
    }

    const game = Games.findOne(gameId);

    if (!userId || !game)
        throw new Meteor.Error('no-permission', 'You don\'t have permission to do that');

    if (game.currentPhase !== phase)
        throw new Meteor.Error('wrong-phase', 'You can\'t take that action in the current game phase.');

    return game;
};

Meteor.methods({
	submitFaceAcro(gameId, acro) {
		check(gameId, String);
		check(acro, String);
		acro = acro.replace('\n', ' ');

		const game = standardMethodChecks(gameId, this.userId, 'face_acro', true, acro),
			roundIndex = game.currentRound - 1,
			currentRound = game.rounds[roundIndex];

		if (!currentRound.players[this.userId])
			throw new Meteor.Error('no-permission', 'You don\'t have permission to do that');

		const acronym = currentRound.acronym;
		var acroArr = acro.split(" ");
		if ( acroArr.length == acronym.length ) {
			for(var i=0; i < acroArr.length; i++){
				const firstchar = acroArr[i].charAt(0).toLowerCase();
				if (firstchar != acronym[i].toLowerCase()) {
					throw new Meteor.Error('invalid', 'Invalid answer');
				}
			}
		} else {
			throw new Meteor.Error('invalid', 'Invalid answer');
		}

		const timeLeft = moment(game.endTime) - moment(),
			setObj = {};

		setObj['rounds.' + roundIndex + '.players.' + this.userId + '.submission'] = { acro: acro, timeLeft: timeLeft };
		Games.update(gameId, {$set: setObj});

		const totalPlayers = Object.values(currentRound.players).filter(player => { return player.role == "player"; }).length - 1;
		let submittedPlayers = 0;
		_.each(currentRound.players, (player, playerId) => {
			if (playerId !== this.userId && player.submission) {
				submittedPlayers++;
			}
		});
		if (submittedPlayers === totalPlayers) {
			GameManager.advancePhase(gameId, 'face_acro', game.currentRound);
		}
	},
	submitAcro(gameId, acro) {
		check(gameId, String);
		check(acro, String);

		//strip new lines from acro string
		acro = acro.replace('\n', ' ');

		const game = standardMethodChecks(gameId, this.userId, 'acro', true, acro),
			roundIndex = game.currentRound - 1,
			currentRound = game.rounds[roundIndex];

		// check if this user in the current round
		if (!currentRound.players[this.userId])
			throw new Meteor.Error('no-permission', 'You don\'t have permission to do that');

		const acronym = currentRound.acronym;
		var acroArr = acro.split(" ");
		if ( acroArr.length == acronym.length ) {
			for(var i=0; i < acroArr.length; i++){
				const firstchar = acroArr[i].charAt(0).toLowerCase();
				if (firstchar != acronym[i].toLowerCase()) {
					throw new Meteor.Error('invalid', 'Invalid answer');
				}
			}
		} else {
			throw new Meteor.Error('invalid', 'Invalid answer');
		}

		const timeLeft = moment(game.endTime) - moment(),
			setObj = {};

		setObj['rounds.' + roundIndex + '.players.' + this.userId + '.submission'] = {
			acro: acro, timeLeft: timeLeft
		};

		Games.update(gameId, {$set: setObj});

		const totalPlayers = Object.keys(currentRound.players).length - 1;
		let submittedPlayers = 0;

		_.each(currentRound.players, (player, playerId) => {
			if (playerId !== this.userId && player.submission) {
				submittedPlayers++;
			}
		});

		if (submittedPlayers === totalPlayers) {
			//everyone has submitted! advance the game phase
			GameManager.advancePhase(gameId, 'acro', game.currentRound);
		}
	},
	findPlayNowLobbyId() {
		const lobbies = Lobbies.find({official: true}, {fields: { players: true }});
		let inLobby;

		// find the lobby with the most players
		let lobbiesWithPlayers = [],
			mostPlayers = 1;

		const allLobbies = [];

		// if they're already in a lobby, throw them in one
		lobbies.forEach(lobby => {
			allLobbies.push(lobby._id);
			if (this.userId && lobby.players.indexOf(this.userId) > - 1)
				inLobby = lobby._id;

			if (lobby.players.length === mostPlayers) {
				lobbiesWithPlayers.push(lobby._id);
			} else if (lobby.players.length > mostPlayers) {
				lobbiesWithPlayers = [lobby._id];
			}
		});

		if (inLobby)
			return inLobby;

		if (lobbiesWithPlayers.length === 1) {
			return lobbiesWithPlayers[0];
		} else if (lobbiesWithPlayers.length > 1) {
			return _.sample(lobbiesWithPlayers);
		}

		return _.sample(allLobbies);
	}
});