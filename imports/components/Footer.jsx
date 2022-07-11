import React from "react";

export class FooterComponent extends React.Component {
  componentDidMount() {
    //GitHub fork button
    $.getScript("https://buttons.github.io/buttons.js", (data, status) => {});
    //weird privacy policy thing
    (function(w, d) {
      var loader = function() {
        var s = d.createElement("script"),
          tag = d.getElementsByTagName("script")[0];
        s.src = "//cdn.iubenda.com/iubenda.js";
        tag.parentNode.insertBefore(s, tag);
      };
      if (w.addEventListener) {
        w.addEventListener("load", loader, false);
      } else if (w.attachEvent) {
        w.attachEvent("onload", loader);
      } else {
        w.onload = loader;
      }
    })(window, document);
  }

  openTermsOfUse = e => {
    e.preventDefault();
    $("#termsOfUseModal").modal("show");
  };

  render() {
    return (
      <div>
        {/*<div className="ui hidden divider" />
        <p className="footer">
          <a href="#" onClick={this.openTermsOfUse}>
            Terms of Use
          </a>
        </p>
        <div className="ui hidden divider" />*/}
      </div>
    );
  }
}
