import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Resume from "./components/Resume";
//Routes designate where the url will send you
function App() {
  const [result, setResult] = useState({}); // this houses the result of the gptfunction
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home setResult={setResult} />} />
          <Route path="/resume" element={<Resume result={result} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
