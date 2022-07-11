import React from "react";
import { TermsOfUseText } from "../views/TermsOfUse";

export class HowToPlayModal extends React.Component {
  componentDidMount() {
    $(this.modal).modal({
      detachable: false,
      observeChanges: true
    });
  }

  render() {
    return (
      <div className="ui modal" id="howToPlayModal" ref={ref => (this.modal = ref)}>
        <div className="content" style={{color: '#707070', backgroundColor: '#e3e3e3', fontFamily: 'sans serif'}}>
          <h2 className="ui header">
            <i className="question icon" />
            <div className="content">
              HOW TO PLAY
              <div className="sub header">
                The online word game that puts your creativity on the line
              </div>
            </div>
          </h2>
          <p>Acromania is a simple game to play, once you get the hang of it. If you're new to Acromania, then there's one main thing you must keep in mind: Have fun! Everything else will follow, including winning. In fact, it's nearly impossible to win at Acromania if you take it too seriously!</p>
          <p>With that in mind, here's a quick tour which will show you how a sample game of Acromania is played:</p>

          <h3 className="ui header">1. Composition Round</h3>
          <p>The Acromania game begins with the Composition Round. During this round, an acronym of 3 to 7 letters will be displayed on the screen. Once all the letters are displayed, you'll have 60 seconds to compose a witty, creative phrase (an "Acro ") based on the displayed acronym and category (category details below). The first letter of each word in your Acro must match the corresponding letter in the acronym given.</p>
          <p>The first person to submit their Acro will receive two speed bonus points. Be careful! If you rush to enter an Acro merely for the speed points, then your answer may not be as creative as those of the other players. Take it slow and speed will come with time. At the end of the sixty second Composition Round, you'll enter the Voting Round.</p>

          <h3 className="ui header">2. Voting Round</h3>
          <p>The Voting Round is the part of the game where you'll find out just how clever your Acro is, or isn't. (Remember, what's funny, witty or creative to you may or may not be to other players.)</p>
          <p>At the beginning of the Voting Round, all players' Acros are displayed on the screen with no names attached. You have at least 20 seconds to vote for the Acro you like best by clicking on the number next to your favorite Acro. (You can't vote for your own answer. If you could, then everyone would vote for themselves!) The more Acros received, the more time you have to vote for the one you like.</p>

          <h3 className="ui header">3. Scoring</h3>
          <p>A speed bonus of two points is awarded to the player who answers first and receives at least one vote.</p>
          <p>The player who receives the most votes gets the Acro Bonus, which is one point per letter in the acronym. (Ties are broken by speed; the player who enters his or her Acro quickest among the tied players receives the Acro Bonus.)</p>
          <p>Each person who voted for the winning Acro receives the Voters Bonus, which is one point. You do not need to compose an answer to receive this point, but it's almost impossible to win a game on voting alone!</p>
          <p>It's very important that you vote. If you don't, you lose all of the points you would have earned that round, so be sure to choose your favorite!</p>

          <h3 className="ui header">4. Face-Off Round</h3>
          <p>The game continues until someone scores at least 30 points. Once a player scores 30 points or more, that player and the next highest scorer proceed to the Face-Off Round.</p>
          <p>At the start of Face-Off, both players' scores are reset and they begin three lightning-fast composition rounds. The two Face-Off players only have 20 seconds to create their Acro during each round. After each round, the Face-Off players' Acros are displayed and the other players can vote for their favorite Acro. The Face-Off player with the most votes at the end of all three rounds wins.</p>
          <p>The voting for Face-Off is exactly like the normal Voting Round, but there are no bonus points awarded. At the end of the Face-Off Round, all Face-Off Acros are displayed with the number of votes they received. A new game of Acromania will then begin again in a few seconds.</p>

          <h3 className="ui header">5. Chatting</h3>
          <p>During each round (Composition, Voting, and Face-Off) a chat window is located at the bottom of the screen for players to chat. This is a great opportunity to get to know the other players and give them some gentle ribbing about a lame Acro or congratulate them on a creative one.</p>
          <p>Chatting is not required to play the game, but it may very well increase your enjoyment of the overall game experience!</p>

          <h3 className="ui header">6. A Few Hints</h3>
          <p>We do not have a spell or grammar checker in the game. When you write your answers, you can type almost anything you want into the entry box. We allow punctuation for hyphenated words and the like, but this can be abused. Generally speaking, it is poor form to string-words_together just'so-they_fit the_Acro-for.the.round.</p>
          <p>This game is policed by the community. If you cause problems in a game room, expect to be kicked out of it.</p>
          <p>There are many different rooms in Acromania. If you drop into a game room and you don't like the people in it, go to another one.</p>
        </div>
      </div>
    );
  }
}

export class NotificationInfoModal extends React.Component {
  componentDidMount() {
    $(this.modal).modal({
      detachable: false,
      observeChanges: true
    });
  }

  render() {
    return (
      <div
        className="ui small basic modal"
        id="notificationInfoModal"
        ref={ref => (this.modal = ref)}>
        <div className="ui icon header">
          <i className="alarm outline icon" />
          Looks like you've disabled notifications for this site
        </div>
      </div>
    );
  }
}

export class TermsOfUseModal extends React.Component {
  componentDidMount() {
    $(this.modal).modal({
      detachable: false,
      observeChanges: true
    });
  }

  render() {
    return (
      <div
        className="ui modal"
        id="termsOfUseModal"
        ref={ref => (this.modal = ref)}
      >
        <div className="content">
          <h2 className="ui header">Acromania Terms of Use</h2>
          {TermsOfUseText}
        </div>
      </div>
    );
  }
}

export class PageDimmer extends React.Component {
  componentDidMount() {
    $(this.dimmer).dimmer({
      closable: false
    });
  }

  render() {
    return (
      <div className="ui page dimmer" ref={ref => (this.dimmer = ref)}>
        <div className="content">
          <div className="ui inverted loader" />
        </div>
      </div>
    );
  }
}
