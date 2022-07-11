import PropTypes from "prop-types";
import React, { PureComponent } from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";

import { GlobalFeedComponentContainer } from "../components/Feeds";
import { OnlinePlayersContainer } from "../components/OnlinePlayers";
import { Lobbies } from "../collections";
import { lobbySubs } from "../subsManagers";

const LobbyRow = ({ lobby }) => (
  <div style={{padding: 10, border: 'solid 2px #0000ef', borderRadius: 25, width: 300, marginBottom: 20, color: '#aa0000', fontFamily: 'Dungeon', fontSize: 18, fontWeight: 'bold',
    textAlign: 'center', boxShadow: "0px 0px 15px #0000ef", cursor: 'pointer'}} 
    onClick={()=>FlowRouter.go(FlowRouter.path("room", { lobbyId: lobby._id }))}>
    {lobby.displayName} ( {lobby.players.length} )
  </div>
);

LobbyRow.propTypes = {
  lobby: PropTypes.object
};

class PlayView extends PureComponent {
  static propTypes = {
    ready: PropTypes.bool.isRequired,
    lobbies: PropTypes.array.isRequired
  };

  UNSAFE_componentWillMount() {
    //SEO stuff
    var title = "Find Rooms - Acromania";
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

  render() {
    let lobbyTable;
    if (this.props.ready) {
      lobbyTable = (
        <div style={{marginTop: 30, marginBottom: 50, marginLeft: 100}}>
          {this.props.lobbies.map((lobby, index) => (
            <LobbyRow key={index} lobby={lobby} />
          ))}
        </div>
      );
    } else {
      lobbyTable = <div className="ui centered inline active loader" />;
    }

    return (
      <div>
        <h2 className="ui header">
          <i className="search icon" />
          <div className="content" style={{fontFamily: 'Dungeon'}}>
            Join a room to start playing
          </div>
        </h2>
        <div className="ui hidden divider" />
        <div className="ui stackable grid">
          <div className="sixteen wide column" style={{padding: 0}}>
            {lobbyTable}
          </div>
          <div className="three wide column" style={{padding: 0}}>
            <OnlinePlayersContainer />
          </div>
          <div className="thirteen wide column" style={{padding: 0}}>
            <GlobalFeedComponentContainer />
          </div>
        </div>
      </div>
    );
  }
}

export const PlayViewContainer = withTracker(() => {
  lobbySubs.subscribe("lobbies");
  const data = {
    lobbies: Lobbies.find().fetch()
  };

  let players = data.lobbies.reduce((prev, cur) => {
    return prev.concat(cur.players);
  }, []);

  const handle = Meteor.subscribe("otherPlayers", _.uniq(players));
  data.ready = lobbySubs.ready() && handle.ready();

  return data;
})(PlayView);
