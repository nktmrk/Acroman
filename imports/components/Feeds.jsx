import PropTypes from "prop-types";
import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import { autolink } from "react-autolink";
import { emojify } from "react-emojione";

import { playSound, displayName, specialTags, findUserById } from "../helpers";
import { GlobalFeed, LobbyFeed } from "../collections";

const submitChat = (evt, lobbyId) => {
  evt.preventDefault();
  if (Meteor.userId()) {
    const form = $(evt.currentTarget);
    const message = form.form("get values").message;

    if (lobbyId) {
      Meteor.call("addLobbyFeedChat", lobbyId, message);
    } else {
      Meteor.call("addGlobalFeedChat", message);
    }

    form.trigger("reset");
  } else {
    FlowRouter.go("/sign-in");
  }
};

const ChatInput = ({ lobbyId }) => (
  <div style={{borderTop: '#333333 4px solid'}}>
    <form id="chat-input-form" className="ui form" onSubmit={evt => submitChat(evt, lobbyId)}>
      <div className="ui fluid icon input">
        <input type="text" id="chat-input-box" name="message" autoComplete="off" required
          style={{backgroundColor: 'transparent', border: 0, color: '#ffcf30', padding: 8}} />
      </div>
    </form>
  </div>
);

ChatInput.propTypes = {
  lobbyId: PropTypes.string
};

const UserSpecialTag = ({ color, tag }) => {
  const style = { marginLeft: "5px" },
    className = `ui mini ${color || "red"} horizontal basic label`;

  return (
    <div className={className} style={style}>
      {tag}
    </div>
  );
};

const emojisAndLinks = s => {
  let arr = autolink(s, {
    target: "_blank",
    rel: "nofollow"
  });

  arr = arr.map(obj => {
    if (typeof obj === "string") {
      return emojify(obj, {
        styles: { backgroundImage: "url(/emojione.sprites.png)" }
      });
    }
    return obj;
  });

  return arr;
};

const SingleEvent = ({ user, summary, detail }) => {
  let usernameOrSummary;

  if (user) {
    const tags = specialTags(user);
    usernameOrSummary = (
      <span>
        <a href="" className="userProfilePicture" style={{color: '#ffcf30'}}>
          &lt;{displayName(user)}&gt;:&nbsp;
        </a>
        {tags && tags.map(tag => (
          <UserSpecialTag key={tag.tag} tag={tag.tag} color={tag.color} />
        ))}
      </span>
    );
  } else {
    usernameOrSummary = <span style={{color: '#f0f'}}>** {summary}</span>;
  }

  return (
    <div className="summary" style={{color: '#ffcf30', fontSize: 14}}>
      {usernameOrSummary}
      <span style={user ? {color: '#ffcf30'}:{color:'#f0f'}}>
      {detail && emojisAndLinks(detail)}</span>
    </div>
  );
};

SingleEvent.propTypes = {
  user: PropTypes.object,
  icon: PropTypes.string,
  timestamp: PropTypes.instanceOf(Date).isRequired,
  summary: PropTypes.string,
  detail: PropTypes.string
};

class GlobalFeedComponent extends Component {
  static propTypes = {
    globalFeedLimit: PropTypes.number.isRequired,
    subsReady: PropTypes.bool.isRequired,
    events: PropTypes.array.isRequired,
    users: PropTypes.array.isRequired
  };

  constructor(props) {
    super(props)
    this.myRef = React.createRef();
  }

  componentDidMount() {
    const feedOuter = $(".feedChatDiv");
    const feed = feedOuter.find(".feedInner");
    feed.scroll(function() {
      var fadeUpper = feedOuter.find(".fade.upper");
      var fadeLower = feedOuter.find(".fade.lower");
      var scroll = feed.scrollTop();
      if (scroll > 50) {
        fadeUpper.css("opacity", 1);
      } else {
        fadeUpper.css("opacity", scroll / 50);
      }

      var innerFeed = feed.find(".feed");
      var bottomScroll = innerFeed.height() - scroll - feedOuter.height();

      if (bottomScroll > 50) {
        fadeLower.css("opacity", 1);
      } else {
        fadeLower.css("opacity", bottomScroll / 50);
      }

      var getMoreDiv = $(".getMoreDiv");
      if (getMoreDiv.length && getMoreDiv.isOnScreen()) {
        var limit = Session.get("globalFeedLimit");
        limit += 20;
        if (limit <= 200) {
          Session.set("globalFeedLimit", limit);
        }
      }
    });
  }

  componentDidUpdate() {
    const scrollHeight = this.myRef.scrollHeight;
    const height = this.myRef.clientHeight;
    var maxScrollTop = scrollHeight - height;
    this.myRef.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
  }

  render() {
    const showGetMoreDiv = this.props.events.length === this.props.globalFeedLimit;

    return (
      <div style={{border: '#333333 4px solid', color: '#ffcf30'}}>
        <div className="feedChatDiv" style={{padding: 5, fontFamily: 'Open Sans'}}>
          <div className="feedInner" ref={(div) => {this.myRef = div;}}>
            <div className="ui small feed">
              {this.props.events.map(event => (
                <SingleEvent
                  key={event._id}
                  {...event}
                  user={findUserById(this.props.users, event.user)} />
              ))}
            </div>
            {!this.props.subsReady && (
              <div className="ui inline active centered loader" />
            )}
            {showGetMoreDiv && <div className="getMoreDiv" />}
          </div>
        </div>
        <ChatInput />
      </div>
    );
  }
}

export const GlobalFeedComponentContainer = withTracker(() => {
  if (!Session.get("globalFeedLimit")) {
    Session.set("globalFeedLimit", 20);
  }

  const handle = Meteor.subscribe("globalFeed", Session.get("globalFeedLimit"));

  var data = {
    globalFeedLimit: Session.get("globalFeedLimit"),
    subsReady: handle.ready(),
    events: GlobalFeed.find({}, { sort: { timestamp: 1 } }).fetch(),
    users: []
  };

  let playerIds = [];

  for (let i = 0; i < data.events.length; i++) {
    if (data.events[i].user) {
      playerIds.push(data.events[i].user);
    }
  }

  playerIds = _.uniq(playerIds);
  if (playerIds.length > 0) {
    Meteor.subscribe("otherPlayers", playerIds);
    data.users = Meteor.users.find({ _id: { $in: playerIds } }).fetch();
  }

  return data;
})(GlobalFeedComponent);

class LobbyFeedComponent extends Component {
  static propTypes = {
    subsReady: PropTypes.bool.isRequired,
    lobbyFeedLimit: PropTypes.number.isRequired,
    events: PropTypes.array.isRequired,
    lobbyId: PropTypes.string
  };

  constructor(props) {
    super(props)
    this.myRef = React.createRef();
  }

  componentDidMount() {
    $(window).scroll(function() {
      var getMoreDiv = $(".getMoreDiv");
      if (getMoreDiv.length && getMoreDiv.isOnScreen()) {
        var limit = Session.get("lobbyFeedLimit");
        limit += 20;
        if (limit <= 200) Session.set("lobbyFeedLimit", limit);
      }
    });

    setTimeout(this.startComputation, 0);
  }

  componentDidUpdate() {
    const scrollHeight = this.myRef.scrollHeight;
    const height = this.myRef.clientHeight;
    var maxScrollTop = scrollHeight - height;
    this.myRef.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
  }

  componentWillUnmount() {
    if ( this.tracker != null ) {
      this.tracker.stop();
    }
  }

  startComputation = () => {
    this.tracker = Tracker.autorun(() => {
      LobbyFeed.find({ lobbyId: this.props.lobbyId }).observeChanges({
        added: (id, doc) => {
          if (this.props.subsReady && doc.user) {
            playSound("chat");
          }
        }
      });
    });
  };

  render() {
    return (
      <div style={{border: '#333333 4px solid', color: '#ffcf30'}}>
        <div className="feedChatDiv" style={{padding: 5, fontFamily: 'Open Sans'}}>
          <div className="feedInner" ref={(div) => {this.myRef = div;}}>
            <div className="ui small feed">
              {this.props.events.map(event => (
                <SingleEvent key={event._id} {...event} user={findUserById(this.props.users, event.user)} />
              ))}
            </div>
          </div>
          {!this.props.subsReady && <div className="ui inline active centered loader" />}
          {this.props.events.length === this.props.lobbyFeedLimit && <div className="getMoreDiv" />}
        </div>
        <ChatInput lobbyId={this.props.lobbyId} />
      </div>
    );
  }
}

export const LobbyFeedComponentContainer = withTracker(({ lobbyId }) => {
  if (!Session.get("lobbyFeedLimit")) Session.set("lobbyFeedLimit", 20);

  const handle = Meteor.subscribe( "lobbyFeed", lobbyId, Session.get("lobbyFeedLimit"));

  const data = {
    lobbyFeedLimit: Session.get("lobbyFeedLimit"),
    subsReady: handle.ready(),
    events: LobbyFeed.find(
      { lobbyId: lobbyId },
      { sort: { timestamp: 1 } }
    ).fetch(),
    users: []
  };

  let playerIds = [];
  for (let i = 0; i < data.events.length; i++) {
    if (data.events[i].user) {
      playerIds.push(data.events[i].user);
    }
  }

  if (playerIds.length > 0) {
    playerIds = _.uniq(playerIds);
    Meteor.subscribe("otherPlayers", playerIds);
    data.users = Meteor.users.find({ _id: { $in: playerIds } }).fetch();
  }

  return data;
})(LobbyFeedComponent);
