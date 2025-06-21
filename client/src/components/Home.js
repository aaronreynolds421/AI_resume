import React, { useState } from "react";
import Loading from "./Loading";

const Home = () => {
  const [fullName, setFullName] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [currentLength, setCurrentLength] = useState(1);
  const [currentTechnologies, setCurrentTechnologies] = useState("");
  const [headshot, setHeadshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jobInfo, setJobInfo] = useState([{ name: "", position: "" }]);

  const handleAddJob = () =>
    setJobInfo([...jobInfoInfo, { name: "", position: "" }]); //updates the users input by using ... to copy the the existing array and puts it into a new array
  // to then append { name: "", position: "" } to the end of the new array

  const handleRemoveJob = (index) => {
    setJobInfo(jobInfo.filter((_, i) => i !== index)); // this function handles the removal of the job info with the press of a button.
  };

  const updateJob = (e, index) => {
    const { name, value } = e.target;
    const list = [...jobInfo];
    list[index][name] = value;
    setJobInfo(list); // this function handles the updating of the job info.
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log({
      fullName,
      currentPosition,
      currentLength,
      currentTechnologies,
      headshot,
    });
    setLoading(true);
  };
  if (loading) {
    return <Loading />;
  }
  return (
    <div className="app">
      <h1>Resume Builder</h1>
      <p>Generate a resume with ChatGPT in a few seconds</p>
      <form
        onSubmit={handleFormSubmit}
        method="POST" //used for sending data to a server to create or update a resource
        encType="multipart/form-data" //forms is crucial when dealing with file uploads
      >
        <label htmlFor="fullName">Enter Full Name</label>
        <input
          type="text"
          required //makes this text required
          name="fullName"
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <div className="nestedContainer">
          <div>
            <label htmlFor="currentPosition">Enter Current Position</label>
            <input
              type="text"
              required //makes this text required
              name="currentPosition"
              className="currentInput"
              value={currentPosition}
              onChange={(e) => setCurrentPosition(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="currentLength">How Long?</label>
            <input
              type="number"
              required //makes this text required
              name="currentLength"
              className="currentInput"
              value={currentLength}
              onChange={(e) => setCurrentLength(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="currentTechnologies">Tech used</label>
            <input
              type="text"
              required //makes this text required
              name="currentTechnologies"
              className="currentInput"
              value={currentTechnologies}
              onChange={(e) => setCurrentTechnologies(e.target.value)}
            />
          </div>
        </div>
        <button>Create Resume</button>
      </form>
    </div>
  );
};

export default Home;
