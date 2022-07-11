import React from "react";
import MultiSlider, { Progress } from 'react-multi-bar-slider';

const getDiff = endTime => {
  return Math.max(0, moment(endTime).diff(TimeSync.now(), 'seconds'));
};

export class CountdownIconHeader extends React.Component {
  _isMounted = false;

  constructor(props) {
    super(props);

    this.state = {
      diff: getDiff(props.endTime),
      progress: 100,
      color: '#aa0000'
    };
  }

  componentDidMount() {
    this._isMounted = true;

    const adiff = getDiff(this.props.endTime);
    var i=0, progressval=100;
    const animateInterval = setInterval(() => {
      i = i+1;
      progressval=progressval-100/adiff;
      if (this._isMounted) {
        this.setState({diff: i, progress: progressval});
      }
      if ( i >= adiff-1 ) {
        clearInterval(animateInterval);
        this.calcEverySeconds();
      }
    }, 1000/adiff);
  }

  componentWillUnmount() {
    this._isMounted = false;
    clearInterval(this.interval);
  }

  calcEverySeconds() {
    const totalcount = getDiff(this.props.endTime);
    this.interval = setInterval(() => {
      const diff = getDiff(this.props.endTime);
      const progress = 100-(diff/totalcount)*100;
      if (this._isMounted) {
        if ( diff < 10) {
          this.setState({color: '#ffcf30'});
        }
        this.setState({diff, progress});
      }
    }, 1000);
  }

  render() {
    return (
      <div>
        <MultiSlider
          width={250} height={13} roundedCorners readOnly
          style={{display: 'inline-block', marginRight: 15, verticalAlign: 'middle', 
            background: 'linear-gradient(#ba0000, #ff3030, #ff6565, #ff6565, #cf3030, #aa0000, #aa0000, #750000, #650000, #650000, #650000, #650000, #9a0000)',
            boxShadow:'0 0 20px #00f'}}>
          <Progress style={{borderTopRightRadius: 0, borderBottomRightRadius: 0, background: 'linear-gradient(#000, #656565, #000, #000, #000)'}} 
            progress={this.state.progress} color="linear-gradient(#000, #656565, #000, #000, #000)" height={13} />
        </MultiSlider>
        <h1 className="ui icon header" style={{color: this.state.color, margin: 0, verticalAlign: 'middle', fontSize: 35}}>{this.state.diff<10 && '0'}{this.state.diff}
        </h1>
      </div>
    );
  }
}
