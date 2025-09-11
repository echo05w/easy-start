import React from "react";
import "./Login.css";

function Login() {
  return (
    <div className="login-container">
      {/* Family Place title above login box */}
      <h1 className="login-title">Family Place</h1>

      <div className="login-card">
        <div className="login-header">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
            alt="Apple Logo"
            className="apple-logo"
          />
          <h2>Sign in</h2>
        </div>

        <form className="login-form">
          <input type="text" placeholder="Username" />
          <input type="password" placeholder="Password" />
          <button type="submit">→</button>
        </form>

        <div className="login-footer">
          <a href="#">Forgot password?</a>
          <a href="#">Create account</a>
        </div>
      </div>
    </div>
  );
}

export default Login;
