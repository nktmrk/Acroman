import PropTypes from "prop-types";
import React, { PureComponent } from "react";
import { Meteor } from "meteor/meteor";
import { Animate } from "react-simple-animate";
import { AnimateOnChange } from 'react-animation';

import { CountdownIconHeader } from "../Countdown";
import { playSound } from "../../helpers";

class SubmitAcroForm extends PureComponent {
  static propTypes = {
    chosenAcro: PropTypes.string,
    submitAcro: PropTypes.func.isRequired,
    acronym: PropTypes.array
  };

  componentDidMount() {
    const $forms = $([this.desktopForm, this.mobileForm]);

    $forms.form({
      fields: {
        acro: {
          identifier: "acro",
          rules: [
            {
              type: "empty",
              prompt: "You must submit an answer!"
            },
            {
              type: "maxLength[100]",
              prompt: "Please submit an answer under 100 characters"
            }
          ]
        }
      },
      onSuccess: (evt, fields) => {
        this.props.submitAcro(evt, fields);
      }
    });

    // make mobile textarea submit on enter, rather than new line
    const $mobileForm = $(this.mobileForm);
    $mobileForm.keypress(evt => {
      if (evt.which == "13") {
        $mobileForm.form("submit");
        return false;
      }
    });
  }

  onHandleKeyPress(){
    playSound("keyboard");
  }

  render() {
    return (
      <div>
        {/* desktop version */}
        <form className="ui form hiddenOnMobile" ref={ref => (this.desktopForm = ref)}>
          <input type="text" id="answerInput" name="acro" defaultValue={this.props.chosenAcro} required
            style={{backgroundColor: '#c0c0c0', border:'#707070 1px solid', color: '#000', borderRadius: 15, textAlign: 'center', fontSize: 25, padding: 3,
              boxShadow: '0 0 20px #00f'}} onKeyPress={this.onHandleKeyPress} />
          <div className="ui error message" />
        </form>

        {/* mobile version */}
        <form className="ui form showOnMobile" ref={ref => (this.mobileForm = ref)}>
          <div className="field">
            <textarea type="text" name="acro" defaultValue={this.props.chosenAcro} rows="2" required
              style={{backgroundColor: '#c0c0c0', border:'#707070 1px solid', color: '#000', borderRadius: 15, textAlign: 'center', boxShadow: '0 0 20px #00f',
                fontSize: 18, padding: 3}} />
          </div>
          <div className="ui error message" />
        </form>
      </div>
    );
  }
}

class SubmitAcro extends PureComponent {
  static propTypes = {
    round: PropTypes.object.isRequired,
    gameId: PropTypes.string.isRequired,
    face: PropTypes.bool.isRequired
  };

  constructor(props) {
    super(props);

    let chosenAcro, userId = Meteor.userId();
    if (props.round.players[userId] && props.round.players[userId].submission) {
      chosenAcro = props.round.players[userId].submission.acro;
    }
    this.state = { chosenAcro };
  }

  submitAcro = (evt, fields) => {
    evt.preventDefault();
    var form = $(evt.currentTarget),
      btn = form.find("button");
    form.find("input").blur();

    var quest = "submitAcro";
    if ( this.props.face ) {
      quest = "submitFaceAcro";
    }
    btn.addClass("loading");
    Meteor.call(quest, this.props.gameId, fields.acro, err => {
      btn.removeClass("loading");
      if (err) {
        form.form("add errors", [err.reason]);
      } else {
        this.setState({ chosenAcro: fields.acro });
        playSound("submitacro");
      }
    });
  };

  render() {
    return (
      <div className="ui centered grid">
        <div className="sixteen-wide-tablet twelve-wide-computer center aligned column">
          <SubmitAcroForm
            chosenAcro={this.state.chosenAcro}
            submitAcro={this.submitAcro}
            acronym={this.props.round.acronym} />
        </div>
      </div>
    );
  }
}

export class AcroPhase extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      animateTitle: false,
      animateCategory: false,
      animateInput: false,
      animateTimer: false,
      animateComment: false,
      hideAcronym: false,
      animateAcronym: new Array(props.round.acronym.length).fill(false),
    };
  }

  componentDidMount() {
    const { round, face } = this.props;
    if ( !face ) {
      playSound("category");
    }
    setTimeout(()=>this.setState({animateTitle: true}), 1000);
    setTimeout(()=>this.setState({animateCategory: true}), 2000);
    setTimeout(()=>this.setState({animateTimer: true}), round.acronym.length*1000+5000);
    round.acronym.map((word, index) => {
      setTimeout(()=>this.playAnimateAcronym(index), index*1000+4000);
    });
    setTimeout(()=>{
      this.setState({animateInput: true});
      playSound("inputshow");
    }, round.acronym.length*1000+4000);
    setTimeout(()=>{this.setState({animateTimer: true}); playSound("begin");}, round.acronym.length*1000+5000);
    setTimeout(()=> {
      this.setState({animateComment: true});
    }, round.acronym.length*1000+6000);
  }

  playAnimateAcronym(index) {
    const newItems = [...this.state.animateAcronym];
    newItems[index] = true;
    this.setState({animateAcronym: newItems});
    playSound("acronym");
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.currentPhase !== nextProps.currentPhase) {
      setTimeout(()=>{
        this.setState({ animateComment: false, animateTimer: false, animateInput: false, animateTitle: false, hideAcronym: true});
      }, 1000);
    }
  }

  render() {
    const {endTime, round, gameId, currentPhase, face} = this.props;
    const {animateInput, animateTimer, animateComment, animateTitle, animateAcronym, hideAcronym} = this.state;
    const userId = Meteor.userId();
    var isInRound = round.players[userId];
    if ( face ) {
      isInRound = round.players[userId] && round.players[userId].role === 'player' ? true : false;
    }
    const roundPhase = round.acronym.length === 3 ? 1 : round.acronym.length === 4 ? 2 : 3;

    let hasChosenComment = "Type your answer and press Enter";
    if (isInRound && isInRound.submission) {
      var timePassed = (60000-isInRound.submission.timeLeft)/1000;
      hasChosenComment = "Answer accepted: " + Number(timePassed).toFixed(1) + " seconds";
    }
    if (currentPhase=='acro_end'){
      hasChosenComment = 'Time is up!'
    }

    var answerAccept = 0;
    const roundPlayers = Object.keys(round.players);
    if ( roundPlayers.length > 0 ){
      for (let i = 0; i < roundPlayers.length; i++) {
        const playerId = roundPlayers[i];
        if ( round.players[playerId] && round.players[playerId].submission ) {
          answerAccept = answerAccept + 1;
        }
      }
    }

    return (
      <div className="ui stackable grid">
        <div className="eight wide column" style={{textAlign: 'center', padding: 0}}>
          <Animate play={animateTitle} start={{opacity: 0}} end={{opacity: 1}} duration={1}>
            <p className="phaseHeaderLeft">
              {face ? 'Face-Off Round '+roundPhase : round.acronym.length+' Letter Round'}
            </p>
          </Animate>
        </div>
        <div className="eight wide column" style={{textAlign: 'center', padding: 0, marginTop: 6, height: 45}}>
          {animateTimer && <CountdownIconHeader endTime={endTime} />}
        </div>
        <div className="eight wide column" style={{textAlign: 'center', padding: 0, height: 80}}>
          {answerAccept>0 && animateComment &&
            <>
              <AnimateOnChange animation="bounce">
                <div style={{color: '#666666', fontFamily: 'Dungeon', fontSize: 80, fontWeight: 'bold', marginTop: 40}}>{answerAccept}</div>
                <div style={{color: '#fff'}}>ANSWERS ACCEPTED</div>
              </AnimateOnChange>
              {answerAccept==1 && <img src="/images/race.gif" style={{width: 60, marginLeft: -50, marginBottom: 20}} />}
            </>}
        </div>
        <div className="eight wide column" style={{textAlign: 'end', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Animate play={animateTitle} start={{opacity: 0}} end={{opacity: 1}} duration={1}>
            <h2 style={{marginTop: 20, color: '#666666', fontFamily: 'Dungeon'}}>{round.category}</h2>
          </Animate>
        </div>
        <div className="sixteen wide column" style={{padding: 0, textAlign: 'center'}}>
          <Animate play={animateComment} start={{opacity: 0}} end={{opacity: 1}} duration={1}>
            <p className="acroComment">{isInRound && hasChosenComment}</p>
          </Animate>
          <Animate play={hideAcronym} start={{opacity: 1}} end={{opacity: 0}} duration={1.5}>
            {round.acronym.map((word, index) =>
              <Animate play={animateAcronym[index]} duration={1} key={index}
                start={{opacity: 0, display: 'inline-block'}} end={{opacity: 1, display: 'inline-block'}}>
                <h1 className="shadow3D">{word}</h1>
              </Animate>)
            }
          </Animate>
        </div>
        <div className="sixteen wide column" style={{textAlign: 'center', padding: 0, marginBottom: 30, marginTop: 30, height: 50}}>
          {isInRound ? (
            <Animate play={animateInput} start={{display: 'none'}} end={{display: 'block'}} duration={1}>
              <SubmitAcro round={round} gameId={gameId} face={face} />
            </Animate>
          ) : (
            <Animate play={animateInput} start={{opacity: 0}} end={{opacity: 1}} duration={1}>
              <h3 className="ui center aligned disabled header" style={{color:'#e3e3e3'}}>
                Players are writing their answers...
              </h3>
            </Animate>
          )}
        </div>
      </div>
    );
  };
};

AcroPhase.propTypes = {
  round: PropTypes.object.isRequired,
  endTime: PropTypes.instanceOf(Date).isRequired,
  gameId: PropTypes.string.isRequired,
  currentPhase: PropTypes.string.isRequired,
  face: PropTypes.bool.isRequired
};
