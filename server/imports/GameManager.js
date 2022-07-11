import Acromania from './Acromania';
import LobbyManager from './LobbyManager';

import {Games, Lobbies, Categories } from '../../imports/collections';

const GameManager = {
    makeGameActive(gameId) {
        //this function assumes that checks have already been made to ensure this game SHOULD go active
        const game = Games.findOne(gameId);

        if (!game || game.active) {
            console.error('GameManager.makeGameActive was called on a nonexistent or already active game: ' + gameId);
            return;
        }
        //check if the time has passed the game's activeTimeout. If so, create a new game.
        if (game.currentPhase === "endgame" || !game.activeTimeout || moment().isAfter(game.activeTimeout)) {
            //create a new game!!
            const delay = Meteor.settings.acromania.newGameDelay,
                endTime = moment().add(delay, 'milliseconds').toDate();

            Lobbies.update(game.lobbyId, {$set: {newGameStarting: true, endTime: endTime}, $currentDate: {lastUpdated: true}});

            Meteor.setTimeout(function() {
                const lobby = Lobbies.findOne(game.lobbyId, {fields: {players: true}});
                if (lobby.players.length >= Meteor.settings.acromania.minimumPlayers) {
                    GameManager.startNewGame(game.lobbyId);
                } else {
                    Lobbies.update(game.lobbyId, {$set: {newGameStarting: false}, $currentDate: {lastUpdated: true}});
                }
            }, delay);
        } else {
            if (game.currentPhase.includes("face")) {
                const lastRound = game.rounds[game.rounds.length-1];
                const lobby = Lobbies.findOne(game.lobbyId, {fields: {players: true}});

                let totalcount = 0;
                const roundPlayers = Object.keys(lastRound.players);
                for (let i = 0; i < roundPlayers.length; i++) {
                    const playerId = roundPlayers[i];
                    if ( lastRound.players[playerId] && lastRound.players[playerId].role =='player' ) {
                        totalcount++;
                    }
                }

                let count = 0;
                _.each(lobby.players, (playerId) => {
                    if ( lastRound.players[playerId] && lastRound.players[playerId].role =='player' ) {
                        count++;
                    }
                });
                if ( count == totalcount ) {
                    GameManager.startFaceOffRound(game.lobbyId, true);
                }
            } else {
                GameManager.startNewRound(game.lobbyId, true);
            }
        }
    },
    makeGameInactive(gameId) {
        const game = Games.findOne(gameId);

        if (!game || !game.active) {
            console.log('GameManager.makeGameInactive was called on a nonexistent or already inactive game', {gameId: gameId});
            return;
        }

        const activeTimeout = moment().add(Meteor.settings.gameActiveTimeout, 'milliseconds').toDate();

        Games.update(gameId, {$set: {activeTimeout: activeTimeout, active: false}});
        LobbyManager.addSystemMessage(game.lobbyId, 'This game is now inactive. ', 'warning', 'It will resume when there are enough players.');
    },
    startNewGame(lobbyId, type) {
        //start a new game in this room
        //assume checks have already been made and just go ahead and create a new game
        if (!type)
            type = 'acromania';

        try {
            let newGame = {
                type: type,
                lobbyId: lobbyId,
                active: true,
                currentPhase: 'acro',
                currentRound: 0,
                scores: {},
                faceScores: {},
                created: new Date(),
                lastUpdated: new Date()
            };

            const players = Lobbies.findOne(lobbyId).players;

            _.each(players, function(playerId) {
                newGame.scores[playerId] = 0;
            });

            const gameId = Games.insert(newGame);

            //Logger.info('New game started', {lobbyId: lobbyId, gameId: gameId});
            Lobbies.update(lobbyId, {$push: {games: gameId}, $set: {currentGame: gameId, newGameStarting: false}, $currentDate: {lastUpdated: true}});
            LobbyManager.addSystemMessage(lobbyId, 'New game started.');

            GameManager.startNewRound(lobbyId);
        } catch(err) {
            console.error(err);
            /*Logger.error('Error starting new game', { error: err, lobbyId: lobbyId });*/
        }
    },
    startFaceOffRound(lobbyId, setActive) {
        try {
            const lobby = Lobbies.findOne(lobbyId),
                game = Games.findOne(lobby.currentGame);
            if (!game.active && !setActive) {
                return;
            }

            var faceRound = 0;
            if ( game.hasOwnProperty('faceRound') ) {
                faceRound = game.faceRound;
            }
            const acronymv = Acromania.generateAcronym(faceRound);
            let round={acronym: acronymv, players: {}, category: ''};
            const faceOffAcroTimeout = lobby.config.faceOffAcroTimeout+acronymv.length*1000+7000;
            var topPlayers = Object.keys(game.scores)
                .sort(function (a, b) { return game.scores[b] - game.scores[a]; })
                .slice(0, 2);
            _.each(lobby.players, function(playerId) {
                round.players[playerId] = {votes: 0, role: 'voter'};
            });
            let setObj = { currentPhase: 'face_acro', endTime: moment().add(faceOffAcroTimeout, 'milliseconds').toDate(), active: true, faceRound: faceRound };
            _.each(topPlayers, function(playerId) {
                if ( round.players[playerId] ) {
                    round.players[playerId].role = 'player';
                }
                 // make sure players have a face score
                if (!game.faceScores[playerId])
                    setObj['faceScores.' + playerId] = 0;
            });
            Games.update(lobby.currentGame, {$set: setObj, $push: {rounds: round}, $inc: {currentRound: 1}, $currentDate: {lastUpdated: true}});

            Meteor.setTimeout(function() {
                GameManager.advancePhase(lobby.currentGame, 'face_acro', game.currentRound+1);
            }, faceOffAcroTimeout);
        } catch (err) {
            console.error(err);
        }
    },
    startNewRound(lobbyId, setActive) {
        //start new round stuff
        try {
            const lobby = Lobbies.findOne(lobbyId),
                game = Games.findOne(lobby.currentGame);

            if (!game.active && !setActive) {
                //game is inactive, we can't start a new round. Making a game active will start the new round when it can.
                return;
            }
            const players = lobby.players;
            const category = Categories.aggregate([
                {$match: {active: true}},
                {$project: {category: true, custom: true, userId: true}},
                {$sample: {size: 1}}
            ]);
            const acronymv = Acromania.generateAcronym(game.currentRound);
            let round = { acronym: acronymv, players: {}, category: category[0].category};
            _.each(players, function(playerId) {
                round.players[playerId] = { votes: 0, votePoints: 0, votedForWinnerPoints: 0, notVotedNegativePoints: 0, winnerPoints: 0 }
            });

            const acronymTimeout = lobby.config.acronymTimeout+acronymv.length*1000+7000;
            let setObj = { currentPhase: 'acro', endTime: moment().add(acronymTimeout, 'milliseconds').toDate(), active: true };

            // make sure all players have a score
            _.each(players, function(playerId) {
                if (!game.scores[playerId])
                    setObj['scores.' + playerId] = 0;
            });

            // was the last round completed? If not, overwrite this round
            let newRound = game.currentRound + 1;
            if (game.currentRound < 1 || game.rounds[game.currentRound - 1].winner) {
                Games.update(lobby.currentGame, {$set: setObj, $push: {rounds: round}, $inc: {currentRound: 1}, $currentDate: {lastUpdated: true}});
            } else {
                setObj['rounds.' + (game.currentRound - 1)] = round;
                newRound = game.currentRound;
                Games.update(lobby.currentGame, {$set: setObj, $currentDate: {lastUpdated: true}});
            }
            Meteor.setTimeout(function() {
                GameManager.advancePhase(lobby.currentGame, 'acro', newRound);
            }, acronymTimeout);
        } catch(err) {
            console.error(err);
        }
    },
    advancePhase(gameId, currentPhase, currentRound) {
        const game = Games.findOne(gameId, {fields: { lobbyId: true, currentPhase: true, currentRound: true }});

        if (game.currentPhase !== currentPhase || game.currentRound !== currentRound)
            return;

        switch (currentPhase) {
            case 'acro':
                Acromania.goToAcroEnd(gameId);
                break;
            case 'acro_end':
                Acromania.goToVotingPhase(gameId);
                break;
            case 'voting':
                Acromania.goToEndRoundPhase(gameId);
                break;
            case 'face_acro':
                Acromania.goToFaceOffVotingPhase(gameId);
                break;
            case 'face_voting':
                Acromania.goToFaceOffEndRoundPhase(gameId);
                break;
            default:
                console.error('Unknown phase ' + currentPhase);
        }

        Lobbies.update(game.lobbyId, {$currentDate: {lastUpdated: true}});
    }
};

export default GameManager;
