import React, { PureComponent } from "react";

const greycolor = { color: '#e3e3e3' };

export const TermsOfUseText = (
  <>
    <h3 className="ui dividing header" style={greycolor}>No right to access or use</h3>
    <p>
      This website is for Members Only. Non-members are not permitted to
      participate in website activities including chats or gaming. IE: You must
      have a valid account in order to participate in this Website. There is no
      perpetual right to access this website. This site is Private Property, and
      by visiting, you are a guest. The Administration may remove your access to
      this site at any time, for any reason, without explanation.
    </p>
    <h3 className="ui dividing header" style={greycolor}>Valid contact email address</h3>
    <p>
      You are required to have a current working email address to become a
      member of this Website. As such, one must be provided when submitting your
      account application. Site Management may need to communicate with you from
      time-to-time.
    </p>
    <h3 className="ui dividing header" style={greycolor}>Banned accounts</h3>
    <p>
      Your account being banned from the website will be considered a revocation
      of site membership, and constitutes official notice that you are no longer
      permitted to access this website. The ban extends to you as an individual,
      not just the account you created that got banned.
    </p>
    <h3 className="ui dividing header" style={greycolor}>Code of conduct</h3>
    <h4>Harassment</h4>
    <p>
      Harassment of other Guests or Administration will not be tolerated. This
      includes, but is not limited to: “Flaming” others, abusive messages,
      defamatory comments, etc., in either the Chat Window, Acro Submission,
      Topic Submission boxes, or anywhere else on this website. If a player asks
      you to stop making comments to them which they feel are inappropriate, you
      are to cease your comments to and about them immediately. Harassing other
      players will result in your account being banned.
    </p>
    <h4>Racism and hate</h4>
    <p>
      Promoting hate and intolerance of any culture, race, sex or religion will
      result in your account being banned.
    </p>
    <h4>Impersonation</h4>
    <p>
      Any attempt to impersonate another player will result in your account
      being banned. Examples of Impersonation include, but are not limited to:
      Profile pictures, account handles, names or any other part of another
      account's identity.
    </p>
  </>
);

class TermsOfUse extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      checkboxChecked: false,
      loading: false
    };
  }

  acceptTermsOfUse = () => {
    this.setState({ loading: true });
    Meteor.call("acceptTermsOfUse");
    FlowRouter.go("/");
  };

  render() {
    const { checkboxChecked } = this.state;

    return (
      <div style={{ padding: "40px 0 80px 0" }} className="ui text container">
        <h2 className="ui dividing header" style={greycolor}>Terms of Use</h2>
        <div className="ui info message" >
          Before you can access this website, you must read and agree to the
          following terms.
        </div>
        {TermsOfUseText}
        <div className="ui section divider" />
        <div
          className={`ui checkbox ${
            this.state.checkboxChecked ? "checked" : ""
          }`}
          onClick={() =>
            this.setState(({ checkboxChecked }) => ({
              checkboxChecked: !checkboxChecked
            }))
          }
        >
          <input
            checked={this.state.checkboxChecked}
            type="checkbox"
            tabIndex="0"
            className="hidden" 
            onChange={() => this.setState({ checkboxChecked: !checkboxChecked })} />
          <label style={{ lineHeight: "120%", color: '#e3e3e3' }}>
            I agree to the Terms of Use, and acknowledge that breaking
            the agreed terms can result in immediate banning from the site.
          </label>
        </div>
        <button
          style={{ marginTop: "20px" }}
          className={`ui primary button ${
            !this.state.checkboxChecked ? "disabled" : ""
          } ${this.state.loading ? "loading" : ""}`}
          onClick={this.acceptTermsOfUse}
        >
          Continue
        </button>
      </div>
    );
  }
}

export default TermsOfUse;
