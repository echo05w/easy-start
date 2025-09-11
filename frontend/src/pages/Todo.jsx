import React from "react";

function Todo() {
  return (
    <div className="container mt-5">
      <h2 className="mb-4">📝 Family To-Do List</h2>
      <ul className="list-group mb-3">
        <li className="list-group-item d-flex justify-content-between align-items-center">
          Buy groceries <span className="badge bg-success">Done</span>
        </li>
        <li className="list-group-item">Clean the living room</li>
      </ul>
      <div className="d-flex">
        <input type="text" className="form-control me-2" placeholder="Add new task..." />
        <button className="btn btn-success">Add</button>
      </div>
    </div>
  );
}

export default Todo;
