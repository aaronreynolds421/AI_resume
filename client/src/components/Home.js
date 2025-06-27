import React, { useState } from "react";
import Loading from "./Loading";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Home = ({ setResult }) => {
  const [fullName, setFullName] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [currentLength, setCurrentLength] = useState(1);
  const [currentTechnologies, setCurrentTechnologies] = useState("");
  const [headshot, setHeadshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jobInfo, setJobInfo] = useState([{ name: "", position: "" }]);
  const navigate = useNavigate();
  const handleAddJob = () =>
    setJobInfo([...jobInfo, { name: "", position: "" }]); //updates the users input by using ... to copy the the existing array and puts it into a new array
  // to then append { name: "", position: "" } to the end of the new array

  const handleRemoveJob = (index) => {
    setJobInfo(jobInfo.filter((_, i) => i !== index)); // this function handles the removal of the job info with the press of a button.
  };

  const handleUpdateJob = (e, index) => {
    const { name, value } = e.target;
    const list = [...jobInfo];
    list[index][name] = value;
    setJobInfo(list); // this function handles the updating of the job info.
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("currentPosition", currentPosition);
    formData.append("currentLength", currentLength);
    formData.append("currentTechnologies", currentTechnologies);
    formData.append("workHistory", JSON.stringify(jobInfo));
    axios
      .post("https://localHost:3000/resume/create")
      .then((res) => {
        if (res.data.message) {
          console.log(res.data.data);
          navigate("/resume");
        }
      })
      .catch((err) => console.error(err));
    setLoading(true);
  }; //This creates a key pair representing the form fields which are sent to API endpoint
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

        <h3>Jobs you have worked</h3>
        <form>
          {/*--- other UI tags --- */}
          {jobInfo.map((Job, index) => (
            <div className="nestedContainer" key={index}>
              <div className="companies">
                <label htmlFor="name">Company Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  onChange={(e) => handleUpdateJob(e, index)}
                />
              </div>
              <div className="companies">
                <label htmlFor="position">Position Held</label>
                <input
                  type="text"
                  name="position"
                  required
                  onChange={(e) => handleUpdateJob(e, index)}
                />
              </div>

              <div className="btn__group">
                {jobInfo.length - 1 === index && jobInfo.length < 4 && (
                  <button id="addBtn" onClick={handleAddJob}>
                    Add
                  </button>
                )}
                {jobInfo.length > 1 && (
                  <button id="deleteBtn" onClick={() => handleRemoveJob(index)}>
                    Del
                  </button>
                )}
              </div>
            </div>
          ))}
        </form>
        <button>Create Resume</button>
      </form>
    </div>
  );
};

export default Home;
