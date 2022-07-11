import GameManager from './GameManager';
import LobbyManager from './LobbyManager';

import {displayName} from '../../imports/helpers';
import {Games, Lobbies} from '../../imports/collections';
import {RecalculateRankingForGame} from './Rankings';

const ensureCorrectPhase = (gameId, phase) => {
    const game = Games.findOne(gameId);

    if (!game) {
        console.error('ensureCorrectPhase called on nonexistent game');
        return;
    } else if (game.currentPhase === phase) {
        return game;
    }

    console.log('ensureCorrectPhase failed - game should be in ' + phase + ' phase');
};

const goToEndGame = (gameId) => {
    const game = Games.findOne(gameId);
    let winner;
    const faceScores = Object.keys(game.faceScores);
    var maxV = 0;
    winner = faceScores[0];
    for (let i = 0; i < faceScores.length; i++) {
        const playerId = faceScores[i];
        if ( game.faceScores[playerId] > maxV ) {
            maxV = game.faceScores[playerId];
            winner = playerId;
        }
    }
    
    let lobby = Lobbies.findOne(game.lobbyId, {fields: {config: true, players: true, displayName: true}});

    const inactiveTimeout = lobby.config.inactiveTimeout+3000;
    const endTime = moment().add(inactiveTimeout, 'milliseconds').toDate();
    Games.update(gameId, {$set: {currentPhase: 'endgame', endTime, gameWinner: winner}, $currentDate: {lastUpdated: true}});

    LobbyManager.addSystemMessage(game.lobbyId, displayName(winner, true) + ' won the game!', 'star');
    //LobbyManager.addSystemMessage(null, displayName(winner, true) + ' won a game in room ' + lobby.displayName, 'star');
    LobbyManager.addSystemMessage(null, displayName(winner, true) + ' won the game!', 'star');

    Meteor.setTimeout(function() {
        lobby = Lobbies.findOne(game.lobbyId, {fields: {players: true, config: true}});
        if (lobby.players.length < Meteor.settings.acromania.minimumPlayers) {
            GameManager.makeGameInactive(gameId);
        } else {
            GameManager.startNewGame(game.lobbyId);
        }
    }, inactiveTimeout);

    const thoseWhoPlayed = [];
    _.each(game.scores, function(score, player) {
        thoseWhoPlayed.push(player);
    });
    Meteor.users.update({_id: {$in: thoseWhoPlayed}}, {$inc: {'profile.stats.gamesPlayed': 1}}, {multi: true});
    Meteor.users.update(winner, {$inc: {'profile.stats.gamesWon': 1}});

    RecalculateRankingForGame(game, game.created);
};

const getWinnerAndAwardPoints = game => {
    let lobby = Lobbies.findOne(game.lobbyId, {fields: {config: true}}),
        round = game.rounds[game.currentRound - 1];
    let highestVotes = 1, hasVoted = 0, winners = [];

    _.each(round.players, (player, playerId) => {
        if (player.vote) {
            hasVoted++;
            round.players[player.vote].votes++;
        } else {
            if (player.submission) {
                player.notVotedNegativePoints = lobby.config.notVotedNegativePoints;
            } else {
                const lastRound = game.rounds[game.currentRound - 2];

                if (!lastRound)
                    return;

                const lastRoundPlayer = lastRound.players[playerId];
                if (lastRoundPlayer && !lastRoundPlayer.vote && !lastRoundPlayer.submission) {
                    Lobbies.update(game.lobbyId, {$pull: {players: playerId}});
                    LobbyManager.addSystemMessage(game.lobbyId, displayName(playerId, true) + ' was removed for being inactive');
                }
            }
        }
    });

    _.each(round.players, (player, playerId) => {
        player.votePoints += player.votes * lobby.config.votedPoints;

        if (player.votes > highestVotes) {
            winners = [{id: playerId, timeLeft: player.submission.timeLeft}];
            highestVotes = player.votes;
        } else if (player.votes === highestVotes) {
            winners.push({id: playerId, timeLeft: player.submission.timeLeft});
        }
    });

    if (hasVoted === 0) {
        Lobbies.update(game.lobbyId, {$set: {players: []}});
        LobbyManager.addSystemMessage(game.lobbyId, 'No one voted! ', 'warning', 'All players have been removed.');
        GameManager.makeGameInactive(game._id);
        return;
    }

    let winner;
    if (winners.length === 1) {
        winner = winners[0];
    } else {
        winner = _.last(_.sortBy(winners, 'timeLeft'));
    }
    round.winner = winner.id;
    //LobbyManager.addSystemMessage(game.lobbyId, displayName(round.winner, true) + ' won the round!', 'empty star');

    let ultimateWinners = [],
        ultimateHighScore = 0,
        endGamePoints = lobby.config.endGamePoints;

    _.each(round.players, (player, playerId) => {
        if (round.winner === playerId)
            player.winnerPoints = lobby.config.winnerPoints;

        if (round.winner === player.vote)
            player.votedForWinnerPoints = lobby.config.votedForWinnerPoints;

        game.scores[playerId] += player.votePoints + player.winnerPoints + player.votedForWinnerPoints - player.notVotedNegativePoints;

        const newScore = game.scores[playerId];
        if (newScore >= endGamePoints) {
            if (newScore > ultimateHighScore) {
                ultimateWinners = [{id: playerId, score: newScore}];
                ultimateHighScore = newScore;
            } else if (newScore === ultimateHighScore) {
                ultimateWinners.push({id: playerId, score: newScore});
            }
        }
    });

    const setObj = {};
    setObj[`rounds.${game.currentRound - 1}`] = round;
    setObj.scores = game.scores;
    setObj.currentPhase = 'endround';
    setObj.endTime = moment().add(lobby.config.endOfRoundTimeout, 'milliseconds').toDate();

    const winnerAcro = {
        round: game.currentRound,
        acro: round.players[round.winner].submission.acro,
        acronym: round.acronym,
        userId: round.winner,
        category: round.category
    };

    Games.update(game._id, {$set: setObj, $push: {winnerList: winnerAcro}, $currentDate: {lastUpdated: true}});

    Meteor.setTimeout(() => {
        lobby = Lobbies.findOne(game.lobbyId, {fields: {players: true, config: true}});
        if (lobby.players.length < Meteor.settings.acromania.minimumPlayers) {
            GameManager.makeGameInactive(game._id);
        } else {
            if (ultimateWinners.length > 0) {
                GameManager.startFaceOffRound(game.lobbyId);
            } else {
                GameManager.startNewRound(game.lobbyId);
            }
        }
    }, lobby.config.endOfRoundTimeout);
};

const Acromania = {
    generateAcronym(round) {
        try {
            const acronymSettings = Meteor.settings.acromania.acronyms,
                letters = acronymSettings.letters;

            var number = 3;
            if ( round%5 == 0) {
                number = 3;
            } else if ( round%5 == 1) {
                number = 4;
            } else if ( round%5 == 2) {
                number = 5;
            } else if ( round%5 == 3) {
                number = 6;
            } else if ( round%5 == 4) {
                number = 7;
            }
            let acronym = [];
            for (let i = 0; i < number; i++) {
                acronym.push(Random.choice(letters));
            }

            return acronym;
        } catch(err) {
            console.error(err);
        }
    },
    calculateRemainingTime(base, multiplier, num, max) {
        const val = base + (multiplier * num);
        return (max && val > max) ? max : val;
    },
    goToFaceOffVotingPhase(gameId) {
        const game = ensureCorrectPhase(gameId, 'face_acro');

        if (!game) return;

        let submissions = 0;
        _.each(game.rounds[game.currentRound - 1].players, function(player) {
            if (player.submission)
                submissions++;
        });

        if (submissions === 0) {
            Lobbies.update(game.lobbyId, {$set: {players: []}});
            LobbyManager.addSystemMessage(game.lobbyId, 'No one submitted answer. ', 'warning', 'All players have been removed.');
            GameManager.makeGameInactive(gameId);
            return;
        }

        const lobby = Lobbies.findOne(game.lobbyId, {fields: { config: true }});

        const leng = game.rounds[game.currentRound-1].acronym.length;
        let faceOffVoteTimeout = lobby.config.faceOffVoteTimeout+leng*1000+4000;

        const players = _.shuffle(game.players);

        Games.update(gameId, {$set: { currentPhase: 'face_voting', endTime: moment().add(faceOffVoteTimeout, 'milliseconds').toDate(), players: players }});

        Meteor.setTimeout(function() {
            GameManager.advancePhase(gameId, 'face_voting', game.currentRound);
        }, faceOffVoteTimeout);
    },
    goToFaceOffEndRoundPhase(gameId) {
        const game = ensureCorrectPhase(gameId, 'face_voting');
        let lobby = Lobbies.findOne(game.lobbyId, {fields: {config: true}}),
            round = game.rounds[game.currentRound - 1];
        let hasVoted = 0;

        _.each(round.players, (player, playerId) => {
            if (player.vote) {
                hasVoted++;
                round.players[player.vote].votes++;
            } else {
                if (!player.submission) {
                    const lastRound = game.rounds[game.currentRound - 2];

                    if (!lastRound)
                        return;

                    const lastRoundPlayer = lastRound.players[playerId];
                    if (lastRoundPlayer && !lastRoundPlayer.vote && !lastRoundPlayer.submission) {
                        Lobbies.update(game.lobbyId, {$pull: {players: playerId}});
                        LobbyManager.addSystemMessage(game.lobbyId, displayName(playerId, true) + ' was removed for being inactive');
                    }
                }
            }
        });

        /*if (hasVoted === 0) {
            Lobbies.update(game.lobbyId, {$set: {players: []}});
            LobbyManager.addSystemMessage(game.lobbyId, 'No one voted! ', 'warning', 'All players have been removed.');
            GameManager.makeGameInactive(game._id);
            return;
        }*/

        _.each(round.players, (player, playerId) => {
            game.faceScores[playerId] += player.votes;
        });

        const setObj = {};
        setObj[`rounds.${game.currentRound - 1}`] = round;
        setObj.faceScores = game.faceScores;
        setObj.currentPhase = 'face_end';
        setObj.endTime = moment().add(lobby.config.faceOffEndRoundTimeout, 'milliseconds').toDate();
        setObj.faceRound = game.faceRound + 1;
        Games.update(game._id, {$set: setObj, $currentDate: {lastUpdated: true}});

        Meteor.setTimeout(() => {
            lobby = Lobbies.findOne(game.lobbyId, {fields: {players: true, config: true}});
            if (lobby.players.length < Meteor.settings.acromania.minimumPlayers) {
                GameManager.makeGameInactive(game._id);
            } else {
                if (game.faceRound >= 2) {
                    goToEndGame(game._id);
                } else {
                    GameManager.startFaceOffRound(game.lobbyId);
                }
            }
        }, lobby.config.faceOffEndRoundTimeout);
    },
    goToAcroEnd(gameId) { 
        const game = Games.findOne(gameId);
        let setObj = {};
        setObj.currentPhase = 'acro_end';
        Games.update(gameId, {$set: setObj, $currentDate: {lastUpdated: true}});
        Meteor.setTimeout(function() {
            GameManager.advancePhase(gameId, 'acro_end', game.currentRound);
        }, 3000);
    },
    goToVotingPhase(gameId) {
        const game = ensureCorrectPhase(gameId, 'acro_end');

        if (!game) return;

        let submissions = 0;
        _.each(game.rounds[game.currentRound - 1].players, function(player) {
            if (player.submission)
                submissions++;
        });

        if (submissions === 0) {
            Lobbies.update(game.lobbyId, {$set: {players: []}});
            LobbyManager.addSystemMessage(game.lobbyId, 'No one submitted answer. ', 'warning', 'All players have been removed.');
            GameManager.makeGameInactive(gameId);
            return;
        }

        const lobby = Lobbies.findOne(game.lobbyId, {fields: { config: true }});

        let votingTimeout;

        if (lobby.config.timeouts) {
            const timeouts = lobby.config.timeouts;
            const numLetters = game.rounds[game.currentRound - 1].acronym.length;
            const numLettersOver4 = numLetters > 4 ? numLetters - 4 : 0;

            votingTimeout = this.calculateRemainingTime(timeouts.votingBase, timeouts.votingMultiplier + numLettersOver4, submissions, 60000);
        } else {
            const roundPlayers = Object.keys(game.rounds[game.currentRound - 1].players);            
            votingTimeout = lobby.config.votingTimeout+3000+roundPlayers.length*300;
        }

        const players = _.shuffle(game.players);
        Games.update(gameId, {$set: {
            currentPhase: 'voting', endTime: moment().add(votingTimeout, 'milliseconds').toDate(), players: players
        }});

        Meteor.setTimeout(function() {
            GameManager.advancePhase(gameId, 'voting', game.currentRound);
        }, votingTimeout);
    },
    goToEndRoundPhase(gameId) {
        const game = ensureCorrectPhase(gameId, 'voting');
        if (!game) return;

        getWinnerAndAwardPoints(game);
    }
};

export default Acromania;