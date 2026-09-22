import { useState } from "react";
import WalletConnect from "./components/WalletConnect";
import heroImg from "./assets/hero.png";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="header">
        <h1>Hello, Vite + React!</h1>
        <WalletConnect />
      </div>
    </>
  );
}

export default App;
