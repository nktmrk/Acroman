import PropTypes from "prop-types";
import React from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";

import { profilePicture, displayName } from "../helpers";

const PlayerUsername = ({id, displayName, beforeText, afterText, linkToProfile}) => (
  <span>
    {beforeText}
    <a href="">{displayName}</a>
    {afterText}
  </span>
);

export const PlayerUsernameWrapper = withTracker(({ id }) => {
  return {
    displayName: displayName(id)
  };
})(PlayerUsername);

const PlayerImage = ({ profilePicture }) => <img src={profilePicture} />;

export const PlayerImageContainer = withTracker(({ id, size }) => {
  return {
    profilePicture: profilePicture(id, size || 50)
  };
})(PlayerImage);

export const PlayerLabel = ({ user, isFriend, hideCountry, size }) => {
  if (!user) {
    return (
      <div className="ui label">
        <div className="ui inline active mini loader" />
      </div>
    );
  }

  return (
    <div style={{color: '#ffcf30', fontFamily: 'Dungeon'}}>
      {displayName(user)}
    </div>
  );
};

PlayerLabel.propTypes = {
  user: PropTypes.object,
  isFriend: PropTypes.bool,
  hideCountry: PropTypes.bool,
  size: PropTypes.string
};

export const PlayerLabelContainer = withTracker(({ id }) => {
  Meteor.subscribe("otherPlayers", [id]);
  return {
    user: Meteor.users.findOne(id)
  };
})(PlayerLabel);

const isFriend = (userId, thisUser) => {
  if (thisUser && thisUser.profile && thisUser.profile.friends) {
    return thisUser.profile.friends.indexOf(userId) > -1;
  }

  return false;
};

const OnlinePlayers = ({ ready, onlinePlayers, thisUser }) => {
  if (!ready) {
    return <div className="ui active inline centered loader" />;
  }

  return (
    <div className="chatScoreTable">
      {onlinePlayers.map((player, index) => (
        <PlayerLabel
          key={player._id}
          user={player}
          isFriend={isFriend(player._id, thisUser)} />
      ))}
    </div>
  );
};

OnlinePlayers.propTypes = {
  ready: PropTypes.bool.isRequired,
  onlinePlayers: PropTypes.array.isRequired,
  thisUser: PropTypes.object
};

export const OnlinePlayersContainer = withTracker(() => {
  const handle = Meteor.subscribe("allOnlinePlayers");

  return {
    ready: handle.ready(),
    onlinePlayers: Meteor.users.find({ "status.online": true }).fetch(),
    thisUser: Meteor.user()
  };
})(OnlinePlayers);
