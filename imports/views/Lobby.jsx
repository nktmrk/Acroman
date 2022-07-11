import PropTypes from "prop-types";
import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import { Animate } from "react-simple-animate";
import classNames from "classnames";

import { AcroPhase } from "../components/acromania/AcroPhase";
import { VotingPhase } from "../components/acromania/VotingPhase";
import { FaceOffResultPhase } from "../components/acromania/FaceOffResultPhase";
import { FaceOffVotingPhase } from "../components/acromania/FaceOffVotingPhase";
import { RedButton, BlueButton } from "../components/ImageButton";
import { LobbyFeedComponentContainer } from "../components/Feeds";
import { notify, playSound, displayName, findUserById } from "../helpers";
import { Games, Lobbies } from "../collections";
import { lobbySubs } from "../subsManagers";

class GameWindowInner extends Component {
  static propTypes = {
    game: PropTypes.object.isRequired,
    endTime: PropTypes.instanceOf(Date),
    users: PropTypes.array.isRequired,
    config: PropTypes.object
  };

  componentDidMount() {
    setTimeout(this.startComputation.bind(this), 0);
  }

  componentWillUnmount() {
    this.tracker.stop();
  }

  startComputation() {
    this.tracker = Tracker.autorun(() => {
      Games.find({ _id: this.props.game._id }).observeChanges({
        changed: (id, fields) => {
          if (fields.currentRound) {
            notify("New round started", "Acromania");
          }

          if (fields.currentPhase) {
            if (fields.currentPhase === "endround") {
              const game = Games.findOne(this.props.game._id);
              let currentRound = game.rounds[game.currentRound - 1];

              if (currentRound.winner === Meteor.userId()) {
                playSound("roundwin");
                notify("You won the round!", "Acromania");
              } else {
                playSound("roundend");
                notify( displayName(currentRound.winner, true) + " won the round.", "Acromania" );
              }
            } else if (fields.currentPhase === "endgame") {
              const game = Games.findOne(this.props.game._id);
              if (game.gameWinner === Meteor.userId()) {
                playSound("gamewin");
                notify("You won the game!", "Acromania");
              } else {
                playSound("gameend");
                notify( displayName(game.gameWinner, true) + " won the game.", "Acromania" );
              }
            }
          }
        }
      });
    });
  }

  render() {
    if ( this.props.game.currentRound == 0 ) {
      return (<div />);
    }

    var cround = this.props.game.rounds[this.props.game.currentRound - 1];

    switch (this.props.game.type) {
      case "acromania":
        switch (this.props.game.currentPhase) {
          case 'acro':
          case 'acro_end':
            return (
              <AcroPhase
                round={cround}
                endTime={this.props.endTime}
                gameId={this.props.game._id}
                currentPhase={this.props.game.currentPhase}
                face={false} />
            );
          
          case 'voting':
          case 'endround':
            return (
              <VotingPhase
                round={cround}
                endTime={this.props.endTime}
                gameId={this.props.game._id}
                currentPhase={this.props.game.currentPhase}
                users={this.props.users} />
            );

          case 'face_acro':
            return (
              <AcroPhase
                round={cround}
                endTime={this.props.endTime}
                gameId={this.props.game._id}
                currentPhase={this.props.game.currentPhase}
                face={true} />
            );

          case 'face_voting':
          case 'face_end':
            return (
              <FaceOffVotingPhase
                round={cround}
                endTime={this.props.endTime}
                gameId={this.props.game._id}
                users={this.props.users}
                scores={this.props.game.faceScores}
                currentPhase={this.props.game.currentPhase} />
            );

          case 'endgame':
            return (
              <FaceOffResultPhase
                scores={this.props.game.faceScores}
                rounds={this.props.game.rounds}
                winner={this.props.game.gameWinner}
                endTime={this.props.endTime}
                users={this.props.users}
                gameId={this.props.game._id}
                game={this.props.game} />
            );
        }
    }
  }
}

const LobbyPlayerCard = ({ user }) => (
  <div style={{padding: 3, textAlign: 'center', backgroundColor: '#0328ff', color: '#fff', width: 150, borderRadius: 2, marginBottom: 1, fontFamily: 'Dungeon'}}>{displayName(user)}</div>
);

const ScoresTableRow = ({ score }) => (
  <div className={score.active ? null : "disabled"}>
    <a href="" style={{color: Meteor.userId()==score.id?'#00cc33':'#ffcf30', fontFamily: 'Dungeon'}}>{displayName(score.user)}</a>
    <span style={{color: Meteor.userId()==score.id?'#00cc33':'#ffcf30', float: 'right', fontFamily: 'Dungeon'}}>{score.score}</span>
  </div>
);

ScoresTableRow.propTypes = {
  score: PropTypes.shape({
    id: PropTypes.string.isRequired,
    score: PropTypes.number.isRequired,
    active: PropTypes.bool.isRequired,
    user: PropTypes.object.isRequired
  })
};

const ScoresTable = ({ scores, users, playerIds }) => {
  const sortedScores = Object.keys(scores || {}).map(userId => ({
    id: userId,
    score: scores[userId],
    active: playerIds.indexOf(userId) > -1,
    user: findUserById(users, userId)
  }));

  sortedScores.sort((a, b) => b.score - a.score);

  return (
    <div className="chatScoreTable" style={{fontSize: 15}}>
      {sortedScores.map(score => (
        <ScoresTableRow key={score.id} score={score} />
      ))}
    </div>
  );
};

ScoresTable.propTypes = {
  scores: PropTypes.object,
  users: PropTypes.array,
  playerIds: PropTypes.array
};

class LobbyView extends Component {
  static propTypes = {
    lobbyId: PropTypes.string.isRequired,
    lobby: PropTypes.object,
    users: PropTypes.array.isRequired,
    game: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.state = {
      gameStartAnimate: false
    };
  }

  UNSAFE_componentWillMount() {
    this.notifications = Lobbies.find({
      _id: this.props.lobbyId
    }).observeChanges({
      changed: (id, fields) => {
        if (fields.newGameStarting === true) {
          this.setState({gameStartAnimate: true});
          notify("New game starting soon", "Acromania");
        }

        if (fields.currentGame) {
          notify("New game started", "Acromania");
        }
      }
    });

    //SEO stuff
    var title = "Acromania";
    var description = "Acromania is an Acrophobia clone for the modern web.";
    var metadata = {
      description: description,
      "og:description": description,
      "og:title": title,
      "twitter:card": "summary"
    };

    DocHead.setTitle(title);
    _.each(metadata, function(content, name) {
      DocHead.addMeta({ name: name, content: content });
    });
  }

  componentWillUnmount() {
    this.notifications.stop();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.lobby && (!this.props.lobby || this.props.lobby.displayName !== nextProps.lobby.displayName)) {
      DocHead.setTitle(nextProps.lobby.displayName + " - Acromania");
    }
  }

  isInLobby() {
    return (
      this.props.lobby &&
      this.props.lobby.players &&
      this.props.lobby.players.indexOf(Meteor.userId()) > -1
    );
  }

  joinOrLeaveRoom = () => {
    const isInLobby = this.isInLobby();
    Meteor.call("joinOrLeaveRoom", this.props.lobbyId, !isInLobby,
      err => {
        if (err && err.error != "too-many-requests" ) {
          console.error(err);
        }
      }
    );
  };

  getPlayerUsers() {
    if (!this.props.lobby.players) {
      return [];
    }

    return this.props.lobby.players.map(playerId =>
      findUserById(this.props.users, playerId)
    );
  }

  render() {
    if (!this.props.lobby || !this.props.game) {
      return <div className="ui active loader" />;
    }

    const playerUsers = this.getPlayerUsers();
    const { gameStartAnimate } = this.props;

    return (
      <div className="ui stackable grid">
        <div className="sixteen wide column" style={{marginBottom: 30}}>
          <div className="ui raised segment" style={{backgroundColor: 'transparent'}}>
            {this.props.game.active ? 
              <div>
                <GameWindowInner
                  game={this.props.game}
                  endTime={this.props.game.endTime}
                  config={this.props.lobby.config}
                  users={this.props.users} />
              </div> :
              <div>
                <Animate play={gameStartAnimate} start={{opacity: 1}} end={{opacity: 0}} duration={2000}>
                  <h1 style={{color: '#4a80b0', fontFamily: 'Dungeon', marginLeft: '30%'}}>Players</h1>
                </Animate>
                <Animate play={gameStartAnimate} start={{opacity: 1}} end={{opacity: 0}} duration={2000}>
                  {playerUsers.map((user, index) => {
                    return (
                      <Animate key={index} sequenceIndex={index} duration={5000/(playerUsers.length)} start={{opacity: 1}} end={{opacity: 0}}>
                        <LobbyPlayerCard key={user._id} user={user} />
                      </Animate>
                    )
                  })}
                </Animate>
              </div>}
          </div>
        </div>
        <div className="three wide column" style={{padding: 0}}>
          <ScoresTable
            scores={this.props.game.scores}
            playerIds={this.props.lobby.players}
            users={this.props.users} />
        </div>
        <div className="eleven wide column" style={{padding: 0}}>
          <LobbyFeedComponentContainer lobbyId={this.props.lobbyId} />
        </div>
        <div className="two wide column"
          style={{padding: 0, border: '#333333 4px solid', color: '#fff', borderLeftWidth: 0, height: 314, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {this.isInLobby() ? <RedButton style={{width: '90%', maxWidth: 120}} onClick={this.joinOrLeaveRoom} text="Leave" />
          : <BlueButton style={{width: '90%', maxWidth: 120}} onClick={this.joinOrLeaveRoom} text="Join" />}          
        </div>            
      </div>
    );
  }
}

export const LobbyViewContainer = withTracker(({ lobbyId }) => {
  lobbySubs.subscribe("lobbies");

  const data = {
    lobby: Lobbies.findOne(lobbyId),
    users: []
  };

  if (data.lobby) {
    Meteor.subscribe("currentGame", data.lobby.currentGame);
    data.game = Games.findOne(data.lobby.currentGame);
    if (data.game) {
      let playerIds = data.lobby.players || [];
      if (data.game.scores) {
        playerIds = playerIds.concat(_.keys(data.game.scores));
      }
      Meteor.subscribe("otherPlayers", playerIds);
      data.users = Meteor.users.find({ _id: { $in: playerIds } }).fetch();
    }
  }

  return data;
})(LobbyView);