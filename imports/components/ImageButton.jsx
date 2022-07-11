import React, { Component } from "react";

export class BlueButton extends Component {
    _isMounted = false;

    constructor(props) {
      super(props)

      this.state = { fade: false }
    }

    componentDidMount() {
      this._isMounted = true;
    }

    onPressBut = () => {
      if ( this._isMounted ) {
        this.setState({fade: true});
      }
      setTimeout(()=>{
        if ( this._isMounted ) {
          this.setState({fade: false})
        }        
      }, 300);
      this.props.onClick();
    }

    render() {
      const fade = this.state.fade;
  
      return (
        <div style={{...this.props.style, position: 'relative', textAlign: 'center', cursor: 'pointer'}} onClick={this.onPressBut}
            onAnimationEnd={() => {
                if ( this._isMounted ) {
                    this.setState({fade: true});
                }
            }}>
          <img src={fade ? "/images/longbuton.png" : "/images/longbutoff.png"} style={{width:'100%'}} />
          <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'Dungeon'}}>{this.props.text}</div>
        </div>
      )
    }
}

export class RedButton extends Component {
    _isMounted = false;

    constructor(props) {
      super(props)

      this.state = { fade: false }
    }

    componentDidMount() {
        this._isMounted = true;
    }

    onPressBut = () => {
        if ( this._isMounted ) {
            this.setState({fade: true});
        }      
        setTimeout(()=>{
            if ( this._isMounted ) {
                this.setState({fade: false})
            }        
        }, 300);
        this.props.onClick();
    }

    render() {
      const fade = this.state.fade;
  
      return (
        <div style={{...this.props.style, position: 'relative', textAlign: 'center', cursor: 'pointer'}} onClick={this.onPressBut}
            onAnimationEnd={() => {
                if ( this._isMounted ) {
                    this.setState({fade: true});
                }
            }}>
          <img src={fade ? "/images/redbuton.png" : "/images/redbutoff.png"} style={{width:'100%'}} />
          <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'Dungeon'}}>{this.props.text}</div>
        </div>
      )
    }
}