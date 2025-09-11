import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function Home() {
  return (
    <div className="container text-center mt-5">
      <h1 className="display-3 mb-4">🏡 Family Place</h1>
      <p className="lead mb-5">Welcome to your private family hub.</p>

      <div className="d-flex justify-content-center gap-3">
        <Link className="btn btn-primary btn-lg" to="/messenger">Messenger</Link>
        <Link className="btn btn-success btn-lg" to="/todo">To-Do List</Link>
        <Link className="btn btn-info btn-lg" to="/gallery">Gallery</Link>
      </div>
    </div>
  );
}

export default Home;
