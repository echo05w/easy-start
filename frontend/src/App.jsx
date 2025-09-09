import React from "react";

function App() {
  return (
    <div className="container my-5">
      <h1 className="text-primary mb-4">Easy Start with Bootstrap!</h1>
      
      <button className="btn btn-success me-2">Success Button</button>
      <button className="btn btn-danger">Danger Button</button>

      <div className="alert alert-warning mt-4" role="alert">
        This is a Bootstrap alert!
      </div>

      <div className="card mt-4" style={{ width: "18rem" }}>
        <div className="card-body">
          <h5 className="card-title">Card Title</h5>
          <p className="card-text">Some quick example text.</p>
          <a href="#" className="btn btn-primary">Go somewhere</a>
        </div>
      </div>
    </div>
  );
}

export default App;
