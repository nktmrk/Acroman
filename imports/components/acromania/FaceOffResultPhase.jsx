import PropTypes from "prop-types";
import React, { Component } from "react";
import { Animate } from "react-simple-animate";

import { CountdownIconHeader } from "../Countdown";
import { findUserById, displayName } from "../../helpers";

export class FaceOffResultPhase extends Component {
  constructor(props) {
    super(props);

    this.state = {
      animateSeq: new Array(6).fill(false),
      firstAcros: [],
      secondAcros: [],
      thirdAcros: []
    };
  }

  componentDidMount() {
    const { rounds, users, scores } = this.props;

    const firstRound = rounds[rounds.length-3];
    const secondRound = rounds[rounds.length-2];
    const thirdRound = rounds[rounds.length-1];

    let roundPlayers = Object.keys(firstRound.players);
    const firstAcros = [];
    for (let i = 0; i < roundPlayers.length; i++) {
      const playerId = roundPlayers[i];
      if ( firstRound.players[playerId]  && firstRound.players[playerId].role =='player' && firstRound.players[playerId].submission ) {
        const user = findUserById(users, playerId);
        firstAcros.push({id: playerId, acro: firstRound.players[playerId].submission.acro, name: user.username, vote: firstRound.players[playerId].votes});
      }
    }

    roundPlayers = Object.keys(secondRound.players);
    const secondAcros = [];
    for (let i = 0; i < roundPlayers.length; i++) {
      const playerId = roundPlayers[i];
      if ( secondRound.players[playerId]  && secondRound.players[playerId].role =='player' && secondRound.players[playerId].submission ) {
        const user = findUserById(users, playerId);
        secondAcros.push({id: playerId, acro: secondRound.players[playerId].submission.acro, name: user.username, vote: secondRound.players[playerId].votes});
      }
    }

    roundPlayers = Object.keys(thirdRound.players);
    const thirdAcros = [];
    for (let i = 0; i < roundPlayers.length; i++) {
      const playerId = roundPlayers[i];
      if ( thirdRound.players[playerId]  && thirdRound.players[playerId].role =='player' && thirdRound.players[playerId].submission ) {
        const user = findUserById(users, playerId);
        thirdAcros.push({id: playerId, acro: thirdRound.players[playerId].submission.acro, name: user.username, vote: thirdRound.players[playerId].votes, 
          score: scores[playerId]});
      }
    }
    this.setState({ firstAcros, secondAcros, thirdAcros });

    setTimeout(()=>this.setAnimateSeq(0, true), 500);
    setTimeout(()=>this.setAnimateSeq(1, true), 1000);
    setTimeout(()=>this.setAnimateSeq(2, true), 1500);
    setTimeout(()=>this.setAnimateSeq(3, true), 2000);
    setTimeout(()=>this.setAnimateSeq(4, true), 2500);
    setTimeout(()=>this.setAnimateSeq(5, true), 3000);
  }

  setAnimateSeq(index, value) {
    const newItems = [...this.state.animateSeq];
    newItems[index] = value;
    this.setState({animateSeq: newItems});
  }
  
  render() {
    const {animateSeq, firstAcros, secondAcros, thirdAcros} = this.state;
    const { endTime, rounds, winner } = this.props;

    const firstRound = rounds[rounds.length-3];
    const secondRound = rounds[rounds.length-2];
    const thirdRound = rounds[rounds.length-1];

    return (
      <div className="ui stackable grid" style={{fontFamily: 'Duegon'}}>
        <div className="eight wide column" style={{height: 120}}>
          <Animate play={animateSeq[0]} duration={1} start={{opacity: 0}} end={{opacity: 1}}>
            <p className="phaseHeaderLeft">Face-Off Results</p>
          </Animate>
        </div>
        <div className="eight wide column" style={{textAlign: 'end', height: 120}}>
          {animateSeq[1] && <CountdownIconHeader endTime={endTime} />}
        </div>

        <div className="sixteen wide column">
          <Animate play={animateSeq[1]} duration={1} start={{opacity: 0}} end={{opacity: 1}}>
            <h1 style={{color: '#aa0000', fontSize: 40, textAlign: 'center'}}>{displayName(winner)} Wins!</h1>
          </Animate>
        </div>
        <div className="three wide column" style={{paddingTop: 41, paddingBottom: 0}}>
          <Animate play={animateSeq[3]} duration={1} start={{opacity: 0}} end={{opacity: 1}}>
            {firstAcros.map((acro, index) => (
              <div key={index} style={{color: '#ffcf30', height: 30, display: 'flex', alignItems: 'center'}}>
                <div style={{width: '95%', paddingLeft: 5, paddingTop: 3, paddingBottom: 3}}>{acro.name}</div>
              </div>
            ))}
          </Animate>
        </div>
        <div className="thirteen wide column" style={{padding: 0}}>
          <Animate play={animateSeq[3]} duration={1} start={{opacity: 0}} end={{opacity: 1}}>
            <h2 style={{color: '#f00', marginBottom: 5, marginLeft: 48, marginTop: 5, fontFamily: 'Duegon'}}>{firstRound.acronym.join("")}</h2>
            {firstAcros.map((acro, index) => (
              <div key={index} style={{display: 'flex', alignItems: 'center', height: 30, cursor: 'pointer', fontSize: 18, color: '#ffcf30'}}>
                <div className="votingBut" style={{backgroundColor: '#ba0000', marginRight: 10}}>{acro.vote}</div>
                <div style={{border: 'solid 1px #0000ef', flex: 'auto', padding: 3}}>{acro.acro}</div>
              </div>
            ))}
          </Animate>
        </div>

        <div className="three wide column" style={{paddingTop: 60, paddingBottom: 0}}>
          <Animate play={animateSeq[4]} duration={1} start={{opacity: 0}} end={{opacity: 1}}>
            {secondAcros.map((acro, index) => (
              <div key={index} style={{color: '#ffcf30', height: 30, display: 'flex', alignItems: 'center'}}>
                <div style={{width: '95%', paddingLeft: 5, paddingTop: 3, paddingBottom: 3}}>{acro.name}</div>
              </div>
            ))}
          </Animate>
        </div>
        <div className="thirteen wide column" style={{padding: 0}}>
          <Animate play={animateSeq[4]} duration={1} start={{opacity: 0}} end={{opacity: 1}}>
            <h2 style={{color: '#f00', marginBottom: 5, marginLeft: 48, marginTop: 25, fontFamily: 'Duegon'}}>{secondRound.acronym.join("")}</h2>
            {secondAcros.map((acro, index) => (
              <div key={index} style={{display: 'flex', alignItems: 'center', height: 30, cursor: 'pointer', fontSize: 18, color: '#ffcf30'}}>
                <div className="votingBut" style={{backgroundColor: '#ba0000', marginRight: 10}}>{acro.vote}</div>
                <div style={{border: 'solid 1px #0000ef', flex: 'auto', padding: 3}}>{acro.acro}</div>
              </div>
            ))}
          </Animate>
        </div>

        <div className="three wide column" style={{paddingTop: 60, paddingBottom: 0}}>
          <Animate play={animateSeq[5]} duration={1} start={{opacity: 0}} end={{opacity: 1}}>
            {thirdAcros.map((acro, index) => (
              <div key={index} style={{color: '#ffcf30', height: 30, display: 'flex', alignItems: 'center'}}>
                <div style={{width: '95%', paddingLeft: 5, paddingTop: 3, paddingBottom: 3}}>{acro.name}</div>
              </div>
            ))}
          </Animate>
        </div>
        <div className="thirteen wide column" style={{padding: 0}}>
          <Animate play={animateSeq[5]} duration={1} start={{opacity: 0}} end={{opacity: 1}}>
            <h2 style={{color: '#f00', marginBottom: 5, marginLeft: 48, marginTop: 25, fontFamily: 'Duegon'}}>{thirdRound.acronym.join("")}</h2>
            {thirdAcros.map((acro, index) => (
              <div key={index} style={{display: 'flex', alignItems: 'center', height: 30, cursor: 'pointer', fontSize: 18, color: '#ffcf30'}}>
                <div className="votingBut" style={{backgroundColor: '#ba0000', marginRight: 10}}>{acro.vote}</div>
                <div style={{border: 'solid 1px #0000ef', flex: 'auto', padding: 3}}>{acro.acro}</div>
              </div>
            ))}
          </Animate>
        </div>
        
        <div className="sixteen wide column" style={{display: 'flex', justifyContent: 'center'}}>
          <div style={{textAlign: 'center', width: '80%'}} className="ui middle aligned selection list">
            <Animate play={animateSeq[2]} duration={1} start={{opacity: 0}} end={{opacity: 1}}>
            {thirdAcros[0] && <div style={{float: 'left', display: 'flex', marginTop: 10, fontFamily: 'Dungeon', fontSize: 18}}>
              <div className="votingBut" style={{backgroundColor: '#aa0000', marginRight: 10}}>{thirdAcros[0].score}</div>
              <div style={{color: '#ffcf30', display: 'flex', alignItems: 'center'}}>{thirdAcros[0].name}</div>
            </div>}
            {thirdAcros[1] && <div style={{float: 'right', display: 'flex', marginTop: 10, fontFamily: 'Dungeon', fontSize: 18}}>
              <div style={{color: '#ffcf30', display: 'flex', alignItems: 'center'}}>{thirdAcros[1].name}</div>
              <div className="votingBut" style={{backgroundColor: '#aa0000', marginLeft: 10}}>{thirdAcros[1].score}</div>
            </div>}
            </Animate>
          </div>
        </div>
      </div>
    );
  }
}

FaceOffResultPhase.propTypes = {
  scores: PropTypes.object.isRequired,
  rounds: PropTypes.array.isRequired,
  users: PropTypes.array.isRequired,
  winner: PropTypes.string,
  endTime: PropTypes.instanceOf(Date).isRequired,
  gameId: PropTypes.string.isRequired
};
