import { useState } from "react";
import WalletConnect from "./components/wallet/WalletConnect";
import "./App.css";

import Navigation from "./components/navigation/Navigation";

function App() {
  return (
    <>
      <div className="header">
        <h1>Hello, Vite + React!</h1>
        <WalletConnect />
      </div>
      <div className="navigation">
        <Navigation />
      </div>
    </>
  );
}

export default App;
