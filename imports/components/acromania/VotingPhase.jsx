import PropTypes from "prop-types";
import React, { PureComponent } from "react";
import { Meteor } from "meteor/meteor";
import { Animate } from "react-simple-animate";

import { CountdownIconHeader } from "../Countdown";
import { playSound, findUserById } from "../../helpers";

const handleVote = (evt, id, gameId, currentPhase) => {
  if ( currentPhase == 'voting' ) {
    const userId = Meteor.userId();
    if ( userId != id ) {
      evt.preventDefault();
      Meteor.call("voteForAcro", gameId, id);
      playSound("select");
    }
  }
};

class AutoAnimate extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      val: '',
    };
  }

  componentDidMount() {
    this._isMounted = true;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { newValue } = nextProps;
    if (this.props.newValue!=newValue || newValue==0){
      if (newValue==0 || newValue==1) {
        this.setState({val: newValue});
      } else {
        var i=0;
        const animateInterval = setInterval(() => {
          i = i+1;
          if (this._isMounted) {
            this.setState({val: i});
          }
          if ( i >= newValue ) {
            clearInterval(animateInterval);
          }
        }, 1000/newValue);
      }
    }
  }

  render() {
    const {style} = this.props;
    const {val} = this.state;

    return (
      <div className="votingBut" style={style}>{val}</div>
    );    
  }
}

export class VotingPhase extends React.Component {
  constructor(props) {
    super(props);

    const roundPlayers = Object.keys(props.round.players);

    this.state = {
      startAnimate: false,
      animateAcros: new Array(roundPlayers.length).fill(false),
      animateNames: new Array(roundPlayers.length).fill(false),
      animateVotes: new Array(roundPlayers.length).fill(''),
      roundAcros: [],
      animateTimer: false,
      animateComment: false,
      fastId: -1,
      animateWinner: false,
      animateFast: false
    };
  }

  componentDidMount() {
    const {round, users} = this.props;
    const roundPlayers = Object.keys(round.players);
    const length = roundPlayers.length;
    const roundAcros = [];
    for (let i = 0; i < length; i++) {
      const playerId = roundPlayers[i];
      if ( round.players[playerId] && round.players[playerId].submission ) {
        const user = findUserById(users, playerId);
        roundAcros.push({id: playerId, acro: round.players[playerId].submission.acro, name: user.username, vote: round.players[playerId].votes});
      }
    }
    this.setState({ roundAcros });

    setTimeout(this.setState({startAnimate: true}), 1000);
    for (let i = 0; i < length; i++) {
      setTimeout(()=>this.playAnmiateAcro(i), i*300+1000);
    }
    setTimeout(()=>this.setState({animateTimer: true}), length*300+1000);
    setTimeout(()=>this.setState({animateComment: true}), length*300+2000);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const userId = Meteor.userId();
    if (this.props.round.players[userId] && (this.props.round.players[userId].vote !== nextProps.round.players[userId].vote)) {
      this.setState({animateTimer: false, animateComment: false});
    }
    if ( this.props.currentPhase != nextProps.currentPhase ) {
      const players = nextProps.round.players;
      const roundPlayers = Object.keys(players);
      const roundAcros = [];
      for (let i = 0; i < roundPlayers.length; i++) {
        const playerId = roundPlayers[i];
        if ( players[playerId] && players[playerId].submission ) {
          const user = findUserById(nextProps.users, playerId);
          roundAcros.push({id: playerId, acro: players[playerId].submission.acro, name: user.username, vote: players[playerId].votes});

          setTimeout(()=>{
            const newItems = [...this.state.animateNames];
            newItems[i] = true;
            this.setState({animateNames: newItems});
          }, i*500+1000);

          setTimeout(()=>{
            const votes = players[playerId].votes;
            const newItems = [...this.state.animateVotes];
            newItems[i] = votes;
            this.setState({animateVotes: newItems});
          }, i*500+roundPlayers.length*500+1000);
        }
      }
      this.setState({roundAcros});

      var fastId = roundPlayers[0];
      var timeLeft = 0;
      if ( players[fastId] && players[fastId].submission && players[fastId].submission.timeLeft ){
        timeLeft = players[fastId].submission.timeLeft;
      }
      for (let i = 0; i < roundPlayers.length; i++) {
        const playerId = roundPlayers[i];
        if (players[playerId] && players[playerId].submission && players[playerId].submission.timeLeft && (players[playerId].submission.timeLeft > timeLeft)) {
          fastId = playerId;
        }
      }
      this.setState({fastId});

      setTimeout(()=>{
        this.setState({animateWinner: true});
        playSound("winner");
      }, roundPlayers.length*800+2000);
      setTimeout(()=>{
        this.setState({animateFast: true});
      }, roundPlayers.length*800+3000);
      setTimeout(()=>{
        this.setState({startAnimate: false, animateTimer: false, animateComment: false, animateWinner: false, animateFast: false, 
          animateAcros: new Array(roundPlayers.length).fill(false), animateNames: new Array(roundPlayers.length).fill(false) });
      }, 19000);
    }
  }

  playAnmiateAcro(index) { 
    const newItems = [...this.state.animateAcros];
    newItems[index] = true;
    this.setState({animateAcros: newItems});
  }

  votedForThisAcro = (id) => {
    const userId = Meteor.userId();
    const {round} = this.props;
    
    if ( round.players && round.players[userId] && round.players[userId].vote )
      return round.players[userId].vote === id;
    else return false;
  };

  render() {
    const userId = Meteor.userId();
    const {round, endTime, gameId, currentPhase} = this.props;
    const {startAnimate, animateAcros, animateTimer, animateComment, animateNames, animateVotes, roundAcros, fastId, animateWinner, animateFast} = this.state;
    const isInRound = !!round.players[userId];

    return (
      <div className="ui stackable grid">
        <div className="eight wide column" style={{textAlign: 'center', padding: 0, height: 125}}>
            <Animate play={startAnimate} duration={1} start={{opacity: 0}} end={{opacity: 1}}>
              <p className="phaseHeaderLeft">Voting Round</p>
            </Animate>
          </div>
        <div className="eight wide column" style={{textAlign: 'center', padding: 0, marginTop: 6, height: 125}}>
          <div style={{height: 45}}>
            {animateTimer && <CountdownIconHeader endTime={endTime} style={{opacity: animateTimer ? 1 : 0}} />}
          </div>          
          <Animate play={startAnimate} duration={1} start={{opacity: 0}} end={{opacity: 1}}>
            <h2 style={{marginTop: 20, color: '#666666', fontFamily: 'Dungeon'}}>{round.category}</h2>
          </Animate>
        </div>
        <div className="three wide column" style={{padding: 0}}>
          {currentPhase=='voting' ? 
            <div style={{display: 'flex', alignItems: 'center', fontFamily: 'Dungeon', fontSize: 20, color: '#cccccc', height: '100%', marginTop: 5, marginBottom: 5}}>
              {isInRound && animateComment && 'Choose your favourite'}
            </div> : 
            roundAcros.map((acro, index) => (
              <Animate play={animateNames[index]} key={index} duration={0.3} start={{opacity: 0}} end={{opacity: 1}}>
                <div style={{color: '#ffcf30', height: 30, display: 'flex', alignItems: 'center'}}>
                  <div style={{width: '95%', paddingLeft: 5, paddingTop: 3, paddingBottom: 3,
                    backgroundColor: acro.id==round.winner?'#00f':acro.id==fastId&&'#f00'}}>{acro.name}</div>
                  {((acro.id==round.winner)&&animateWinner) ? 
                    <img src="/images/star.gif" style={{width: 30, marginLeft: -50}} />
                  : ((acro.id==fastId)&&animateFast) && 
                    <img src="/images/race.gif" style={{width: 50, marginLeft: -50}} />
                  }
                </div>
              </Animate>
            ))}
        </div>
        <div className="thirteen wide column" style={{padding: 0}}>
          {isInRound ? 
            roundAcros.map((acro, index) => 
              <Animate play={animateAcros[index]} key={index} duration={0.1} start={{opacity: 0}} end={{opacity: 1}}>
                <div onClick={evt => handleVote(evt, acro.id, gameId, currentPhase)}
                  style={{display: 'flex', alignItems: 'center', height: 30, cursor: 'pointer', fontSize: 18, color: this.votedForThisAcro(acro.id) ? '#df0000' : userId==acro.id ? '#00cc33' : '#ffcf30'}}>
                  {currentPhase=='voting' ? 
                    <div className="votingBut" style={{backgroundSize: 'contain', backgroundImage: this.votedForThisAcro(acro.id) ? "url('/images/buton.png')" : "url('/images/butoff.png')", marginRight: 10}}>{index+1}</div> 
                    : <AutoAnimate newValue={animateVotes[index]} style={{backgroundColor: '#ba0000', marginRight: 10}} />}
                  {acro.acro}
                </div>
              </Animate>)
            : <div className="ui relaxed list">
              {roundAcros.map((acro, index) => (
                <div key={index} style={{display: 'flex', alignItems: 'center', height: 30, cursor: 'pointer', fontSize: 18, color: '#ffcf30'}}>
                  {/*currentPhase=='voting' ? 
                    <div className="votingBut" style={{backgroundColor: '#ba0000', marginRight: 10}}>{index+1}</div> 
                    : <AutoAnimate newValue={animateVotes[index]} style={{backgroundColor: '#ba0000', marginRight: 10}}/>*/}
                  <div className="votingBut" style={{backgroundColor: '#ba0000', marginRight: 10}}>{currentPhase=='voting' ? index+1 : animateVotes[index]}</div>
                  {acro.acro}
                </div>
              ))}
            </div>}
        </div>
      </div>
    );
  }
}

VotingPhase.propTypes = {
  round: PropTypes.object.isRequired,
  endTime: PropTypes.instanceOf(Date).isRequired,
  gameId: PropTypes.string.isRequired,
  currentPhase: PropTypes.string.isRequired,
  users: PropTypes.array.isRequired
}