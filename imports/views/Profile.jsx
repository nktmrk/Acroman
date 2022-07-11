import PropTypes from "prop-types";
import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import Highchart from "react-highcharts";

import { displayName, specialTags } from "../helpers";
import { lobbySubs } from "../subsManagers";
import { Lobbies } from "../collections";

const Statistic = ({ value, label }) => (
  <div className="statistic">
    <div className="value" style={{color: '#00cc30'}}>{value}</div>
    <div className="label" style={{color: '#00cc30'}}>{label}</div>
  </div>
);

Statistic.propTypes = {
  value: PropTypes.any,
  label: PropTypes.string.isRequired
};

const UserStats = ({ stats, user }) => {
  const formattedStats = [
    {
      label: "Played games",
      value: stats.played
    },
    {
      label: "Games won",
      value: stats.won
    }
  ];

  return (
    <div className="ui two statistics">
      {formattedStats.map(stat => (
        <Statistic key={stat.label} {...stat} />
      ))}
    </div>
  );
};

UserStats.propTypes = {
  stats: PropTypes.object,
  user: PropTypes.object
};

const UserStatChartGamesPlayed = ({ stats }) => {
  const config = {
    chart: {
      zoomType: "x",
      backgroundColor: '#333333'
    },
    title: {
      text: "Games played"
    },
    xAxis: {
      type: "datetime",
      title: {
        text: "Date"
      }
    },
    yAxis: [
      {
        title: {
          text: "Games"
        },
        min: 0
      },
      {
        title: {
          text: "Win rate"
        },
        labels: {
          format: "{value}%"
        },
        opposite: true,
        min: 0,
        max: 100
      }
    ],
    tooltip: {
      shared: true
    },
    series: [
      {
        name: "Games played",
        type: "spline",
        tooltip: {
          valueSuffix: " games"
        },
        data: []
      },
      {
        name: "Games won",
        type: "spline",
        tooltip: {
          valueSuffix: " games"
        },
        data: []
      },
      {
        name: "Win rate",
        type: "spline",
        tooltip: {
          valueSuffix: "%"
        },
        data: [],
        yAxis: 1
      }
    ]
  };

  _.each(stats, function(value, date) {
    config.series[0].data.push([parseInt(date), value.played]);
    config.series[1].data.push([parseInt(date), value.won]);
    config.series[2].data.push([parseInt(date), value.winRate]);
  });

  return <Highchart config={config} />;
};

class EditProfileModal extends Component {
  componentDidMount() {
    const $modal = $(this.modal),
      $usernameForm = $(this.usernameForm),
      $countryForm = $(this.countryForm),
      $countrySelect = $(this.countrySelect);

    $modal.modal({
      detachable: false,
      observeChanges: true
    });

    $usernameForm.form({
      fields: {
        username: ["maxLength[20]", "empty"]
      },
      onSuccess: (evt, fields) => {
        evt.preventDefault();
        const $submitBtn = $usernameForm.find("button");
        $submitBtn.addClass("loading");
        Meteor.call("changeUsername", fields.username, err => {
          $submitBtn.removeClass("loading");
          if (err) {
            $usernameForm.form("add errors", [err.reason]);
          } else {
            $usernameForm.trigger("reset");
            $modal.modal("hide");
          }
        });
      }
    });

    $countrySelect.dropdown();
    if (this.props.user && this.props.user.profile && this.props.user.profile.country) {
      $countrySelect.dropdown("set selected", this.props.user.profile.country);
    }

    $countryForm.form({
      onSuccess: (evt, fields) => {
        evt.preventDefault();
        const $submitBtn = $countryForm.find("button");
        $submitBtn.addClass("loading");
        Meteor.call("changeCountry", fields.country, err => {
          $submitBtn.removeClass("loading");
          if (err) {
            $countryForm.form("add errors", [err.reason]);
          } else {
            $modal.modal("hide");
          }
        });
      }
    });
  }

  openModal = evt => {
    evt.preventDefault();
    $(this.modal).modal("show");
  };

  changePassword = evt => {
    evt.preventDefault();
    $(this.modal).modal("hide");
    FlowRouter.go("/change-password");
  };

  render() {
    return (
      <div className="ui modal" ref={ref => (this.modal = ref)}>
        <div className="header">Edit profile</div>
        <div className="image content">
          <div className="description">
            <div className="ui header">Edit username</div>
            <form className="ui form" ref={ref => (this.usernameForm = ref)}>
              <div className="field">
                <input
                  type="text"
                  name="username"
                  placeholder="New username"
                  defaultValue={this.props.displayName} />
              </div>
              <button className="ui positive button" type="submit">
                Save username
              </button>
              <div className="ui error message" />
            </form>
          </div>
        </div>
        <div className="actions">
          <div className="ui left floated button" onClick={this.changePassword}>
            Change password
          </div>
          <div className="ui cancel button">Close</div>
        </div>
      </div>
    );
  }
}

class InviteModal extends Component {
  static propTypes = {
    displayName: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    lobbies: PropTypes.array.isRequired,
    ready: PropTypes.bool.isRequired
  };

  state = {
    hasInvited: false
  };

  componentDidMount() {
    $(this.modal).modal({
      detachable: false,
      observeChanges: true
    });
  }

  closeModal() {
    $(this.modal).modal("hide");
  }

  inviteToPlay = (evt, lobbyId) => {
    evt.preventDefault();
    this.setState({ hasInvited: true });
    Meteor.call("inviteToPlay", this.props.userId, lobbyId, err => {
      if (err) {
        alert(err.reason);
      } else {
        alert("Invite sent");
      }

      this.closeModal();
      Meteor.setTimeout(() => {
        this.setState({ hasInvited: false });
      }, 500);
    });
  };

  render() {
    const styles = {
      list: {
        textAlign: "center"
      }
    };

    return (
      <div
        className="ui small basic modal"
        id="user_invite_modal"
        ref={ref => (this.modal = ref)}>
        <div className="ui icon header">
          <i className="mail outline icon" />
          Invite {this.props.displayName} to play
          <div className="sub header">Pick a room</div>
        </div>
        <div className="content">
          <h3 className="ui centered inverted header">Pick a room</h3>
          {(() => {
            if (this.props.ready && !this.state.hasInvited) {
              return (
                <div
                  style={styles.list}
                  className="ui middle aligned inverted selection list">
                  {this.props.lobbies.map(lobby => (
                    <div
                      key={lobby._id}
                      className="item"
                      onClick={evt => this.inviteToPlay(evt, lobby._id)}>
                      <div className="content">{lobby.displayName}</div>
                    </div>
                  ))}
                </div>
              );
            } else {
              return (
                <div className="ui active inline centered inverted loader" />
              );
            }
          })()}
        </div>
      </div>
    );
  }
}

const InviteModalContainer = withTracker(() => {
  lobbySubs.subscribe("lobbies");
  const lobbies = Lobbies.find().fetch(),
    ready = lobbySubs.ready();

  return { lobbies, ready };
})(InviteModal);

class ProfileView extends Component {
  static propTypes = {
    userId: PropTypes.string.isRequired,
    ready: PropTypes.bool.isRequired,
    user: PropTypes.object,
    thisUser: PropTypes.object,
    isOwnProfile: PropTypes.bool
  };

  state = {
    gamesPlayedStats: null,
    averageScoreStats: null,
    isModerator: false
  };

  UNSAFE_componentWillMount() {
    this.refreshStats();

    Meteor.call("isAdminUserOrModerator", (err, res) =>
      this.setState({ isModerator: res })
    );
  }

  refreshStats() {
    Meteor.call("getUserStat", this.props.userId, "gamesPlayed", (err, res) => {
      if (err) return console.error(err);
      this.setState({ gamesPlayedStats: res || false });
    });

    Meteor.call(
      "getUserStat",
      this.props.userId,
      "averageScoreAndRating",
      (err, res) => {
        if (err) return console.error(err);
        this.setState({ averageScoreStats: res || false });
      }
    );

    Meteor.call("getUserStat", this.props.userId, "ranking", (err, res) => {
      if (err) return console.error(err);
      this.setState({ ranking: res });
    });
  }

  clickRefresh(evt) {
    evt.preventDefault();
    if (this.state.gamesPlayedStats === null || this.state.averageScoreStats === null)
      return;
    this.setState({ gamesPlayedStats: null, averageScoreStats: null });
    this.refreshStats();
  }

  addFriend(evt) {
    evt.preventDefault();
    if (!Meteor.userId()) {
      FlowRouter.go("/sign-in");
      return;
    }
    const $btn = $(evt.currentTarget);
    $btn.addClass("loading");
    Meteor.call("addFriend", this.props.userId, err => {
      $btn.removeClass("loading");
      if (err) console.error(err);
    });
  }

  removeFriend(evt) {
    evt.preventDefault();
    const $btn = $(evt.currentTarget);
    $btn.addClass("loading");
    Meteor.call("removeFriend", this.props.userId, err => {
      $btn.removeClass("loading");
      if (err) console.error(err);
    });
  }

  lastStat() {
    const keys = Object.keys(this.state.gamesPlayedStats);
    if (keys.length > 0) {
      return this.state.gamesPlayedStats[keys[keys.length - 1]];
    } else {
      return {
        played: 0,
        won: 0,
        winRate: 0
      };
    }
  }

  onlineLabel() {
    if (this.props.user.status && this.props.user.status.online) {
      return <div className="ui green right ribbon label">ONLINE</div>;
    } else {
      return <div className="ui red basic right ribbon label">OFFLINE</div>;
    }
  }

  specialTagLabel(specialTag, index) {
    const className = `ui small basic ${
      specialTag.color ? specialTag.color : "red"
    } label`;
    return (
      <div className={className} key={index}>
        {specialTag.tag}
      </div>
    );
  }

  countryLabel() {
    if (
      this.props.user &&
      this.props.user.profile &&
      this.props.user.profile.country
    ) {
      return <i className={this.props.user.profile.country + " flag"} />;
    }
  }

  isFriend() {
    if (
      this.props.thisUser &&
      this.props.thisUser.profile &&
      this.props.thisUser.profile.friends
    ) {
      return (
        this.props.thisUser.profile.friends.indexOf(this.props.userId) > -1
      );
    } else {
      return false;
    }
  }

  banUser = () => {
    const reason = prompt(
      "Why do you want to shadowban this user? Please provide details."
    );
    if (reason && reason.length > 0) {
      Meteor.call("adminShadowbanUser", this.props.userId, true, reason);
    }
  };

  unbanUser = () => {
    Meteor.call("adminShadowbanUser", this.props.userId, false);
  };

  openInviteModal() {
    if (Meteor.userId()) {
      $("#user_invite_modal").modal("show");
    } else {
      FlowRouter.go("/sign-in");
    }
  }

  render() {
    let body;
    const styles = {
      noTop: {
        paddingTop: 0
      },
      noBottom: {
        paddingBottom: 0
      },
      top: {
        paddingTop: "25px"
      },
      refreshIcon: {
        float: "right",
        fontSize: "16px",
        cursor: "pointer"
      },
      inviteBtn: {
        marginBottom: "10px",
        marginRight: "10px"
      }
    };

    if (!this.props.ready) {
      return <div className="ui active loader" />;
    }

    if (!this.props.user) {
      return <em>This user does not exist</em>;
    }

    const tags = specialTags(this.props.user);
    const username = displayName(this.props.user);

    return (
      <div className="ui grid text container">
        <div className="eight wide column" style={styles.noBottom}>
          <h1 className="ui header" style={{ color: '#ffcf30'}}>
            {username}
            {tags && tags.map(this.specialTagLabel)}
            <div className="sub header" style={{ color: '#ff00ff'}}>
              {this.countryLabel()}
              Member since {moment(this.props.user.createdAt).calendar()}
              <br />
              {this.state.ranking
                ? `Ranked #${this.state.ranking.rank} of ${
                    this.state.ranking.total
                  }`
                : "Not ranked"}
            </div>
          </h1>
        </div>
        <div className="eight wide column" style={_.extend(styles.noBottom, styles.top)}>
          {(() => {
            if (this.props.isOwnProfile) {
              return (
                <>
                  {/*<button
                    className="ui icon labeled right floated button"
                    onClick={evt => this.editProfileModal.openModal(evt)}>
                    <i className="edit icon" />
                    Edit
                  </button>*/}
                </>
              );
            } else {
              return (
                <div>
                  {/*<button
                    style={styles.inviteBtn}
                    className="ui primary icon labeled button"
                    onClick={this.openInviteModal}>
                    <i className="mail outline icon" />
                    Invite to play
                  </button>
                  {(() => {
                    if (!this.isFriend()) {
                      return (
                        <button
                          className="ui button"
                          onClick={evt => this.addFriend(evt)}>
                          Add as friend
                        </button>
                      );
                    } else {
                      return (
                        <button
                          className="ui positive icon labeled button"
                          onClick={evt => this.removeFriend(evt)}>
                          <i className="check icon" />
                          Friends
                        </button>
                      );
                    }
                  })()*/}
                  {(() => {
                    if (this.state.isModerator) {
                      return this.props.user.profile.shadowbanned ? (
                        <button className="ui button" onClick={this.unbanUser}>
                          Unban user
                        </button>
                      ) : (
                        <button className="ui button" onClick={this.banUser}>
                          Ban user
                        </button>
                      );
                    }
                  })()}
                </div>
              );
            }
          })()}
        </div>
        <div className="sixteen wide column" style={styles.noTop}>
          <div className="ui divider" />
        </div>
        {/*<div className="five wide column">
          <div className="ui fluid image">
            this.onlineLabel()
          </div>
        </div>*/}
        <div className="sixteen wide column" style={{color: '#00cc30'}}>
          {(() => {
            if ( this.state.gamesPlayedStats !== null ) {
              return (
                <UserStats
                  user={this.props.user}
                  stats={this.lastStat()} />
              );
            } else {
              return <div className="ui inline centered active loader" />;
            }
          })()}
        </div>
        <div className="sixteen wide column">
          <div className="ui hidden divider" />
          <h3 className="ui dividing header" style={{color: '#ffcf30'}}>
            Charts
            {/*<div className="ui tiny label">BETA</div>*/}
            <i className="refresh icon"
              style={styles.refreshIcon}
              onClick={evt => this.clickRefresh(evt)} />
          </h3>
          {(() => {
            if (this.state.gamesPlayedStats) {
              return (
                <UserStatChartGamesPlayed stats={this.state.gamesPlayedStats} />
              );
            } else if (this.state.gamesPlayedStats === false) {
              return <em>No data</em>;
            } else {
              return <div className="ui inline centered active loader" />;
            }
          })()}
          <br />
        </div>
        {(() => {
          if (this.props.isOwnProfile) {
            return (
              <EditProfileModal
                userId={this.props.userId}
                user={this.props.user}
                displayName={username}
                ref={ref => (this.editProfileModal = ref)} />
            );
          } else {
            return (
              <InviteModalContainer
                userId={this.props.userId}
                displayName={username}
                ref={ref => (this.inviteModal = ref)} />
            );
          }
        })()}
      </div>
    );
  }
}

export const ProfileViewContainer = withTracker(({ userId }) => {
  const handle = Meteor.subscribe("otherPlayers", [userId]);

  return {
    ready: handle.ready(),
    user: Meteor.users.findOne(userId),
    isOwnProfile: userId === Meteor.userId(),
    thisUser: Meteor.user()
  };
})(ProfileView);
