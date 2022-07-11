import trueskill from 'trueskill';

import {Games} from '../../imports/collections';

const baseRanking = 25.0,
    skillEstimateMultiplier = 5;

export const IsRankedGameForUser = (rounds, playerId) => {
    const playedRounds = rounds.reduce((prev, round) => {
        return round.players[playerId] && (round.players[playerId].submission || round.players[playerId].vote) ? prev + 1 : prev;
    }, 0);

    return (playedRounds / rounds.length >= 0.4);
};

const initialSigma = baseRanking / skillEstimateMultiplier,
    trueskillBeta = null,
    trueskillEpsilon = null,
    trueskillGamma = null;

trueskill.SetParameters(trueskillBeta, trueskillEpsilon, null, trueskillGamma);

export const RecalculateRankingForGame = (game, date) => {
    if (game.unranked === true) {
        return;
    }

    if (!date)
        date = new Date();

    date = moment(date).valueOf();

    const players = [];
    _.each(game.scores, (score, playerId) => {
        if (!IsRankedGameForUser(game.rounds, playerId)) return;

        let skill;
        const user = Meteor.users.findOne(playerId, {fields: {'profile.trueskill': true}});
        if (user && user.profile && user.profile.trueskill) {
            skill = [user.profile.trueskill.ranking, user.profile.trueskill.sigma];
        } else {
            skill = [baseRanking, initialSigma];
        }

        players.push({
            playerId,
            skill,
            rank: -score
        });
    });

    trueskill.AdjustPlayers(players);

    _.each(players, player => {
        const skillEstimate = player.skill[0] - (skillEstimateMultiplier * player.skill[1]);
        Meteor.users.update({_id: player.playerId}, {
            $set: {
                'profile.trueskill.ranking': player.skill[0],
                'profile.trueskill.sigma': player.skill[1],
                'profile.trueskill.skillEstimate': skillEstimate
            },
            $inc: {
                'profile.trueskill.rankedGames': 1
            },
            $push: {
                trueskillHistory: [date, Math.round(skillEstimate * 100) / 100]
            }
        });
    });
};

export const DecayUserSigmaForMonth = (date) => {
    date = date ? moment(date) : moment();

    const decaySigma = 0.5;

    const startDate = date.subtract(1, 'month').toDate(),
        endDate = date.toDate();

    const knownUsers = Meteor.users.find({
        createdAt: {$lte: startDate}
    }, {
        fields: {
            _id: true
        }
    }).map(user => user._id);

    const usersPlayed = [];

    Games.find({
        gameWinner: {$exists: true},
        created: {
            $gte: startDate,
            $lt: endDate
        }
    }, {
        fields: {
            scores: true
        }
    }).forEach(game => {
        _.each(game.scores, (score, playerId) => {
            if (score > 0 && usersPlayed.indexOf(playerId) === -1) {
                usersPlayed.push(playerId);
            }
        });
    });

    const usersNotPlayed = _.difference(knownUsers, usersPlayed);

    Meteor.users.find({
        _id: {$in: usersNotPlayed},
        'profile.trueskill.sigma': {$lte: initialSigma - decaySigma}
    }).forEach(user => {
        const newSigma = user.profile.trueskill.sigma + decaySigma,
            newSkillEstimate = user.profile.trueskill.ranking - (skillEstimateMultiplier * newSigma);
        Meteor.users.update(user._id, {
            $set: {
                'profile.trueskill.sigma': newSigma,
                'profile.trueskill.skillEstimate': newSkillEstimate
            }
        });
    });
};

export const RecalculateAllRankings = () => {
    const gamesCursor = Games.find({
        gameWinner: {$exists: true}
    }, {
        fields: {scores: true, rounds: true, created: true, unranked: true},
        sort: {created: 1}
    });

    const totalGames = gamesCursor.count();
    let curGame = 0;

    let curMonth = moment(gamesCursor.fetch()[0].created).format('MM-YYYY');

    gamesCursor.forEach(game => {
        const thisMonth = moment(game.created).format('MM-YYYY');
        if (thisMonth !== curMonth) {
            curMonth = thisMonth;
            DecayUserSigmaForMonth(game.created);
        }

        RecalculateRankingForGame(game, game.created);

        curGame++;
    });
};

export const ClearAllRankings = () => {
    Meteor.users.update({}, {$unset: {'profile.trueskill': true, trueskillHistory: true}}, {multi: true});
};