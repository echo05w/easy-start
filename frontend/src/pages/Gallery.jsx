import React from "react";

function Gallery() {
  return (
    <div className="container mt-5">
      <h2 className="mb-4">📸 Family Gallery</h2>
      <div className="row">
        <div className="col-md-4 mb-3">
          <img src="https://via.placeholder.com/300" className="img-fluid rounded shadow" alt="Sample" />
        </div>
        <div className="col-md-4 mb-3">
          <img src="https://via.placeholder.com/300" className="img-fluid rounded shadow" alt="Sample" />
        </div>
        <div className="col-md-4 mb-3">
          <img src="https://via.placeholder.com/300" className="img-fluid rounded shadow" alt="Sample" />
        </div>
      </div>
    </div>
  );
}

export default Gallery;
