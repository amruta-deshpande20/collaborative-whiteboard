import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import Whiteboard from "./components/Whiteboard";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Header />
      <Toolbar />
      <Whiteboard />
      <main className="board-area">
        <h1>Your ideas deserve space.</h1>
        <p>A shared canvas for thinking, creating, and building together.</p>
      </main>
    </div>
  );
}

export default App;
