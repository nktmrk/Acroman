import PropTypes from "prop-types";
import React, { PureComponent } from "react";
import { Meteor } from "meteor/meteor";
import { Animate } from "react-simple-animate";

import { CountdownIconHeader } from "../Countdown";
import { playSound, findUserById } from "../../helpers";

const handleVote = (evt, id, gameId, currentPhase) => {
  if ( currentPhase == 'face_voting') {
    evt.preventDefault();
    Meteor.call("faceVoteForAcro", gameId, id);
    playSound("select");
  }
};

class DecreaseAnimate extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      val: '',
    };
  }

  componentDidMount() {
    this._isMounted = true;
    this.setState({val: this.props.newValue});
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { newValue, startDecrease } = nextProps;
    if (startDecrease){
      if (newValue==0) {
        this.setState({val: newValue});
      } else {
        var i=newValue;
        const animateInterval = setInterval(() => {
          i = i-1;
          if (this._isMounted) {
            this.setState({val: i});
          }
          if ( i == 0 ) {
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

export class FaceOffVotingPhase extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      animateSeq: new Array(8).fill(false),
      endAnimateSeq: new Array(2).fill(false),
      hideAcronym: false,
      animateAcronym: new Array(props.round.acronym.length).fill(false),
      roundAcros: [],
      leftScore: 0,
      rightScore: 0,
      leftVote: 0,
      rightVote: 0,
      leftName: '',
      rightName: ''
    };
  }

  componentDidMount() {
    const {round, users, scores} = this.props;
    const roundPlayers = Object.keys(round.players);
    const length = roundPlayers.length;
    const roundAcros = [];
    for (let i = 0; i < length; i++) {
      const playerId = roundPlayers[i];
      if ( round.players[playerId] && round.players[playerId].role =='player' ) {
        const user = findUserById(users, playerId); 
        let acro = '';
        if ( round.players[playerId].submission ) {
          acro = round.players[playerId].submission.acro;
        }
        roundAcros.push({id: playerId, acro: acro, name: user.username, vote: round.players[playerId].votes, score: scores[playerId]});
      }
    }
    
    this.setState({roundAcros});
    let leftScore = 0, rightScore = 0;;
    if ( roundAcros[0] && roundAcros[0].score ) {
      leftScore = roundAcros[0].score;
    }
    if ( roundAcros[1] && roundAcros[1].score ) {
      rightScore = roundAcros[1].score;
    }
    this.setState({leftScore: leftScore, rightScore: rightScore, leftVote: 0, rightVote: 0});

    setTimeout(()=>this.setAnimateSeq(0, true), 1000);
    round.acronym.map((word, index) => {
      setTimeout(()=>{
        const newItems = [...this.state.animateAcronym];
        newItems[index] = true;
        this.setState({animateAcronym: newItems});
        playSound("acronym");
      }, index*1000+1000);
    });
    setTimeout(()=>{
      this.setAnimateSeq(1, true);
      this.setAnimateSeq(6, true);
    }, round.acronym.length*1000+1000);
    setTimeout(()=>{
      this.setAnimateSeq(2, true);
      this.setAnimateSeq(5, true);
      this.setAnimateSeq(7, true);
    }, round.acronym.length*1000+2000);
    setTimeout(()=>{
      this.setAnimateSeq(3, true);
      this.setAnimateSeq(4, true);
    }, round.acronym.length*1000+3000);
  }

  setAnimateSeq(index, value) {
    const newItems = [...this.state.animateSeq];
    newItems[index] = value;
    this.setState({animateSeq: newItems});
  }

  setEndAnimateSeq(index, value) {
    const newItems = [...this.state.endAnimateSeq];
    newItems[index] = value;
    this.setState({endAnimateSeq: newItems});
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.currentPhase == 'face_end') {
      const {round, users, scores} = nextProps;
      const roundPlayers = Object.keys(round.players);
      const roundAcros = [];
      for (let i = 0; i < roundPlayers.length; i++) {
        const playerId = roundPlayers[i];
        if ( round.players[playerId] && round.players[playerId].role =='player') {
          const user = findUserById(users, playerId);
          let acro = '';
          if ( round.players[playerId].submission ) {
            acro = round.players[playerId].submission.acro;
          }
          roundAcros.push({id: playerId, acro: acro, name: user.username, vote: round.players[playerId].votes, score: scores[playerId]});
        }
      }
      this.setState({ roundAcros });

      let leftVote = 0, rightVote = 0, leftScore=0, rightScore=0;
      if ( roundAcros[0] && roundAcros[0].vote ) {
        leftVote = roundAcros[0].vote;
      }
      if ( roundAcros[1] && roundAcros[1].vote ) {
        rightVote = roundAcros[1].vote;
      }
      if ( roundAcros[0] && roundAcros[0].score ) {
        leftScore = roundAcros[0].score;
      }
      if ( roundAcros[1] && roundAcros[1].score ) {
        rightScore = roundAcros[1].score;
      }
      this.setState({leftVote, rightVote});
      this.setAnimateSeq(5, false);

      setTimeout(()=>{
        this.setAnimateSeq(4, false);
      }, 1000);
      
      setTimeout(()=>{
        this.setEndAnimateSeq(0, true);
      }, 2000);

      setTimeout(()=>{
        this.setState({leftScore, rightScore});
      }, 3000);

      setTimeout(()=>{
        this.setState({hideAcronym: true, animateSeq: new Array(10).fill(false), endAnimateSeq: new Array(2).fill(false)});
      }, 7000);
    }
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
    const {endTime, round, gameId, currentPhase} = this.props;
    const {animateAcronym, hideAcronym, roundAcros, animateSeq, endAnimateSeq, leftScore, rightScore, leftVote, rightVote} = this.state;
    const roundPhase = round.acronym.length === 3 ? 1 : round.acronym.length === 4 ? 2 : 3;
    const isInRound = round.players[userId] && round.players[userId].role === 'player' ? true : false;
    const isOutSider = round.players[userId] ? false : true;
    const itemStyle = { display: 'flex', alignItems: 'center', height: 30, cursor: 'pointer', fontSize: 18 };
    const itemTxtStyle = { height: 28, fontFamily: 'Dungeon', fontWeight: 'lighter', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', fontSize: 23 };

    return (
      <div className="ui stackable grid">
        <div className="eight wide column" style={{textAlign: 'center', padding: 0}}>
          <Animate play={animateSeq[0]} start={{opacity: 0}} end={{opacity: 1}} duration={1}>
            <p className="phaseHeaderLeft">Face-Off Round {roundPhase}</p>
          </Animate>
        </div>
        <div className="eight wide column" style={{textAlign: 'center', padding: 0, marginTop: 6}}>
          {animateSeq[5] && <CountdownIconHeader endTime={endTime} />}
        </div>
        <div className="sixteen wide column" style={{textAlign: 'center', padding: 0}}>
          <Animate play={hideAcronym} start={{opacity: 1}} end={{opacity: 0}} duration={1.5}>
            {round.acronym.map((word, index) => 
              <Animate play={animateAcronym[index]} duration={1} key={index}
                start={{opacity: 0, display: 'inline-block'}} end={{opacity: 1, display: 'inline-block'}}>
                <h1 className="shadow3D">{word}</h1>
              </Animate>)
            }
          </Animate>
        </div>
        <div className="sixteen wide column" style={{display: 'flex', justifyContent: 'center', padding: 0}}>
          <div style={{textAlign: 'center', width: '80%'}} className="ui middle aligned selection list">
            {(isOutSider || isInRound) ? 
              <Animate play={animateSeq[2]} start={{opacity: 0}} end={{opacity: 1}}>
                <h3 className="ui header" style={{color: '#e3e3e3'}}>Other Players are voting ...</h3>
              </Animate>
              :
              <>
                {roundAcros[0] && roundAcros[0].acro!='' &&
                  <div onClick={evt => handleVote(evt, roundAcros[0].id, gameId, currentPhase)} style={itemStyle} disabled>
                    {animateSeq[2] && 
                      <Animate play={endAnimateSeq[0]}
                        start={{backgroundSize: 'contain', backgroundImage: this.votedForThisAcro(roundAcros[0].id) ? "url('/images/buton.png')" : "url('/images/butoff.png')", marginRight: 10}} 
                        end={{backgroundColor: '#aa0000', marginRight: 10}} duration={0.5}
                        render={({style}) => (
                          <div className="votingBut" style={style}>{endAnimateSeq[0] && leftVote}</div>
                        )}>
                    </Animate>}
                    {<Animate play={animateSeq[7]} style={{opacity: 0}} end={{opacity: 1, flex: 'auto', border: 'solid 1px #0000ef'}} duration={0.5}>
                      <div style={{...itemTxtStyle, color: (currentPhase=='face_voting'&&this.votedForThisAcro(roundAcros[0].id)) ? '#df0000' : '#ffcf30'}}>{animateSeq[7] && roundAcros[0].acro}</div>
                    </Animate>}
                    <div className="votingBut" style={{marginLeft: 10, opacity: 0}} />
                  </div>}
                <div style={{color: '#fff', fontFamily: 'Dungeon', fontWeight: 'lighter', marginTop: 5, marginBottom: 5, fontSize: 23,
                  opacity: animateSeq[4] ? 1 : 0}}>Choose your favourite</div>
                {roundAcros[1] && roundAcros[1].acro &&
                  <div onClick={evt => handleVote(evt, roundAcros[1].id, gameId, currentPhase)} style={itemStyle}>
                    {animateSeq[1] && 
                      <Animate play={endAnimateSeq[0]}
                        start={{backgroundSize: 'contain', backgroundImage: this.votedForThisAcro(roundAcros[1].id) ? "url('/images/buton.png')" : "url('/images/butoff.png')", marginRight: 10}} 
                        end={{opacity: 0, marginRight: 10}} duration={0.5}
                        render={({style}) => (
                          <div className="votingBut" style={style} />
                        )}>
                      </Animate>}
                    <Animate play={animateSeq[6]} style={{opacity: 0}} end={{opacity: 1, flex: 'auto', border: 'solid 1px #0000ef'}} duration={0.5}>
                      <div style={{...itemTxtStyle, color: (currentPhase=='face_voting'&&this.votedForThisAcro(roundAcros[1].id)) ? '#df0000' : '#ffcf30'}}>{animateSeq[6] && roundAcros[1].acro}</div>
                    </Animate>
                    <Animate play={endAnimateSeq[0]}
                      start={{opacity: 0, marginLeft: 10}} 
                      end={{backgroundColor: '#aa0000', marginLeft: 10, opacity: 1}} duration={0.5}
                      render={({style}) => (
                        <div className="votingBut" style={style}>{rightVote}</div>
                      )}>
                    </Animate>
                  </div>}
              </>
            }
            {roundAcros[0] && <div style={{float: 'left', display: 'flex', marginTop: 30, fontFamily: 'Dungeon', fontSize: 18}}>
              <div className="votingBut" style={{backgroundColor: '#aa0000', marginRight: 10}}>{leftScore}</div>
              <div style={{color: '#ffcf30', display: 'flex', alignItems: 'center'}}>{roundAcros[0].name}</div>
            </div>}
            {roundAcros[1] && <div style={{float: 'right', display: 'flex', marginTop: 30, fontFamily: 'Dungeon', fontSize: 18}}>
              <div style={{color: '#ffcf30', display: 'flex', alignItems: 'center'}}>{roundAcros[1].name}</div>
              <div className="votingBut" style={{backgroundColor: '#aa0000', marginLeft: 10}}>{rightScore}</div>
            </div>}
          </div>
        </div>
      </div>
    );
  };
}

FaceOffVotingPhase.propTypes = {
  round: PropTypes.object.isRequired,
  endTime: PropTypes.instanceOf(Date).isRequired,
  gameId: PropTypes.string.isRequired,
  users: PropTypes.array.isRequired
};
