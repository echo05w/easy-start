import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Messenger from "./pages/Messenger";
import Todo from "./pages/Todo";
import Gallery from "./pages/Gallery";
import Login from "./pages/Login";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/messenger" element={<Messenger />} />
      <Route path="/todo" element={<Todo />} />
      <Route path="/gallery" element={<Gallery />} />
    </Routes>
  );
}

export default App;
