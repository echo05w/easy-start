import React from "react";

function Messenger() {
  return (
    <div className="container mt-5">
      <h2 className="mb-4">💬 Family Messenger</h2>
      <div className="border rounded p-3 mb-3" style={{ height: "300px", overflowY: "auto" }}>
        <p><b>Dad:</b> Don’t forget dinner at 7 🍲</p>
        <p><b>Mom:</b> Sure ❤️</p>
      </div>
      <div className="d-flex">
        <input type="text" className="form-control me-2" placeholder="Type a message..." />
        <button className="btn btn-primary">Send</button>
      </div>
    </div>
  );
}

export default Messenger;
