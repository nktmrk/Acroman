import React, { PureComponent } from "react";
import { Meteor } from "meteor/meteor";

import { OnlinePlayersContainer } from "../components/OnlinePlayers";
import { GlobalFeedComponentContainer } from "../components/Feeds";
import { lobbySubs } from "../subsManagers";
import { playSound, acromaniaAnalytics } from "../helpers";

/*class GoogleAd extends PureComponent {
  UNSAFE_componentWillMount() {
    DocHead.loadScript(
      "//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
    );
  }

  componentDidMount() {
    (adsbygoogle = window.adsbygoogle || []).push({});
  }

  render() {
    return (
      <div className="ui centered leaderboard ad">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-2611027061957213"
          data-ad-slot="6413070082"
          data-ad-format="auto" />
      </div>
    );
  }
}*/

export class HomeView extends PureComponent {
  UNSAFE_componentWillMount() {
    lobbySubs.subscribe("lobbies");

    //SEO stuff
    const title = "Acromania";
    const description = "Acromania is an Acrophobia clone for the modern web.";
    const metadata = {
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

  playNow = evt => {
    
    /*evt.preventDefault();
    var dimmer = $(".ui.page.dimmer");
    dimmer.dimmer("show");
    Meteor.call("findPlayNowLobbyId", function(err, res) {
      dimmer.dimmer("hide");
      if (err) console.error(err);
      else FlowRouter.go(FlowRouter.path("room", { lobbyId: res }));
    });*/
  };

  howToPlay = evt => {
    /*evt.preventDefault();
    $("#howToPlayModal").modal("show");
    acromaniaAnalytics.page("/howToPlay");*/
    const accountName = 'asdf';
    if (accountName !== '') {
      useEffect(function persistForm() {
        console.log('here');
        //localStorage.setItem('formData', accountName);
      });
    }
  };

  render() {
    const userid = Meteor.userId();

    return (
      <>
        { userid && 
        <div className="ui stackable grid">
          <div className="sixteen wide center aligned column">
            <div className="row" style={{marginTop: 50, marginBottom: 50}}>
              <a className="big ui button mobileBottomMargin"
                style={{clear: "both", backgroundColor: '#00BC5F', color: '#fff', marginBottom: 30, width: 200, marginRight: 20, fontFamily: 'Dungeon'}} 
                href={FlowRouter.path("play")}>
                <img src="/images/playstick.svg" style={{width: 25, height: 20, verticalAlign: 'middle', marginRight: 10}} />
                Play Now
              </a>
              <button className="big ui button" onClick={this.howToPlay} style={{color: '#707070', marginRight: 0, width: 200, fontFamily: 'Dungeon'}}>
                <img src="/images/help.svg" style={{width: 20, height: 20, verticalAlign: 'middle', marginRight: 10}} />
                How to Play
              </button>
            </div>
          </div>
          <div className="three wide column" style={{padding: 0}}>
            <OnlinePlayersContainer />
          </div>
          <div className="thirteen wide column" style={{padding: 0}}>
            <GlobalFeedComponentContainer />
          </div>
          {/*(() => {
            if (Meteor.settings.public.adsEnabled) {
              return (
                <div className="sixteen wide column">
                  <GoogleAd />
                </div>
              );
            }
          })()*/}
        </div>}
        { userid===null && 
        <div className="ui stackable grid" style={{color: '#fff'}}>
          <div className="six wide column" style={{paddingLeft: 20, fontFamily: 'Dungeon'}}>
            <p style={{color: '#fff', fontSize: '5rem', marginTop: 100, marginBottom: 0}}>Join</p>
            <img src="/images/logo.png" style={{width: '90%', marginTop: -10}} />
            <br /><br /><br /><label style={{fontSize: '2rem'}}>A game for</label>
            <p style={{fontSize: '2rem', fontWeight: 'bold'}}>Acronym Maniacs</p>
            {/*<p style={{fontSize: 20, marginBottom: 5}}>Available on</p>
            <div className="row">
              <a href=''>
                <img src="/images/google-play.svg" style={{height: 50, marginRight: 15}} />
              </a>
              <a href=''>
                <img src="/images/app-store.svg" style={{height: 50}} />
              </a>
            </div>*/}
          </div>
          <div className="ten wide column">
            <img src="/images/welcome.svg" style={{width: '90%', float: 'right', marginTop: 200}} />
          </div>
        </div>}
      </>
    );
  }
}
