import React, { Component, PureComponent } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";

import { displayName } from "../helpers";

const LeaderboardTableRow = ({ user, num }) => {
  const currentUser = Meteor.userId();
  return (
    <tr onClick={() =>
        //FlowRouter.go(FlowRouter.path("profile", { userId: user._id }))
        console.log('')
      }>
      <td style={{color: '#666666', fontFamily: 'Dungeon'}}>{num}</td>
      <td>
        <div className="content" >
          <div style={{color: currentUser==user._id?'#00cc33':'#ffcf30', fontFamily: 'Dungeon', fontWeight: 'bold', fontSize: 15}}>{displayName(user)}</div>
          <div className="sub header" style={{color: '#ff00ff', fontFamily: 'Dungeon', fontSize: 12}}>
            Member since {moment(user.createdAt).calendar()}
          </div>
        </div>
      </td>
      <td style={{color: currentUser==user._id?'#00cc33':'#ffcf30', fontFamily: 'Dungeon'}}>{user.profile.trueskill.rankedGames}</td>
      <td style={{color: currentUser==user._id?'#00cc33':'#ffcf30', fontFamily: 'Dungeon'}}>{user.profile.stats.gamesWon}</td>
    </tr>
  );
};

LeaderboardTableRow.propTypes = {
  user: PropTypes.object,
  num: PropTypes.number.isRequired
};

class LeaderboardTable extends Component {
  static propTypes = {
    players: PropTypes.array.isRequired
  };

  componentDidMount() {
    $(this.helpIcon).popup({
      content:
        "A game is considered ranked if you participated in over 40% of its total rounds."
    });
  }

  render() {
    const headStyle = {
      backgroundColor: 'transparent', 
      borderBottom: '#333333 4px solid', 
      color: '#666666',
      fontFamily: 'Dungeon'
    }
    return (
      <table className="ui selectable celled table" style={{backgroundColor: 'transparent', border: '#333333 4px solid'}}>
        <thead>
          <tr>
            <th style={headStyle}>#</th>
            <th style={headStyle}>Player</th>
            <th style={headStyle}>
              Ranked games played{" "}
              {/*<i
                className="mini help circular inverted link icon"
                ref={ref => (this.helpIcon = ref)}
              />*/}
            </th>
            <th style={headStyle}>Games won</th>
          </tr>
        </thead>
        <tbody>
          {this.props.players.map((player, index) => (
            <LeaderboardTableRow
              key={player._id}
              num={index + 1}
              user={player}
            />
          ))}
        </tbody>
      </table>
    );
  }
}

const LeaderboardView = ({ limit, total, players, ready, getMore }) => (
  <div>
    <div className="ui hidden divider" />
    <LeaderboardTable players={players} />
    {total > players.length && (
      <button
        className={ready ? "ui primary button" : "ui primary loading button"}
        onClick={getMore}>
        Show more
      </button>
    )}
  </div>
);

const LeaderboardViewTracker = withTracker(({ limit }) => {
  const handle = Meteor.subscribe("playerRankings", limit);
  const cursor = Meteor.users.find(
    {
      "profile.trueskill.rankedGames": {
        $gte: Meteor.settings.public.leaderboardMinimumGamesToBeVisible
      }
    },
    {
      sort: { "profile.trueskill.skillEstimate": -1 }
    }
  );

  return {
    ready: handle.ready(),
    players: cursor.fetch()
  };
})(LeaderboardView);

export class LeaderboardViewContainer extends PureComponent {
  state = {
    limit: 25,
    total: Infinity
  };

  UNSAFE_componentWillMount() {
    Meteor.call("getTotalRankedCount", (err, res) => {
      if (err) {
        console.error("Error getting total ranked count");
      } else {
        this.setState({ total: res });
      }
    });
  }

  getMore = () => this.setState(state => ({ limit: state.limit + 25 }));

  render() {
    return (
      <LeaderboardViewTracker
        limit={this.state.limit}
        total={this.state.total}
        getMore={this.getMore}
      />
    );
  }
}
