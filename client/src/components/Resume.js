import React from "react";
import ErrorPage from "./ErrorPage";

const Resume = (result) => {
  // replaces the new line with a break tag
  const replaceWithBreak = (string) => {
    return string.replace(/\n/g, "<br/>");
  };

  // returns an error page if the result object is empty
  if (JSON.stringify(result) == "{}") {
    return <ErrorPage />;
  }
  const handlePrint = () => alert("Starting to print");
  return (
    <>
      <button onClick={handlePrint}>Print page</button>
      <main className="container" ref={componentRef}>
        <header className="header">
          <div>
            <h1>{result.fullName}</h1>
            <p className="resumeTitle headerTitle">
              {result.currentPosition} {result.currentTechnologies}
            </p>
            <p className="resumeTitle">{result.currentLength}year(s) worked</p>
          </div>
        </header>
        <div className="resumeBody">
          <div>
            <h2 className="resumeBodyTitle">Profile summary</h2>
            <p
              dangerouslySetInnerHTML={{
                __html: replaceWithBreak(result.objective),
              }}
              className="resumeBodyContent"></p>
          </div>
          <div>
            <h2 className="resumeBodyTitle">Work History</h2>
            {result.workHistory.map((work) => (
              <p className="resumeBodyContent key={work.name}">
                <span style={{ fontWeight: "bold" }}>{work.name}</span>
                {work.position}
              </p>
            ))}
          </div>
          <div>
            <h2 className="resumeBodyTitle">Job Title</h2>
            <p
              dangerouslySetInnerHTML={{
                __html: replaceWithBreak(result.jobResponsibilities),
              }}
              className="resumeBodyContent"></p>
          </div>
          <div>
            <h2 className="resumeBodyTitle">Job Responsibilities</h2>
            <p
              dangerouslySetInnerHTML={{
                __html: replaceWithBreak(result.keyPoints),
              }}
              className="resumeBodyContent"></p>
          </div>
        </div>
      </main>
    </>
  );
};
