import React, { useRef } from "react";
import ErrorPage from "./ErrorPage";
import { useReactToPrint } from "react-to-print";

const Resume = ({ result }) => {
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `${result.fullName} Resume`,
    onAfterPrint: () => alert("Great Success!"),
  });
  console.log("Resume:", result);
  // replaces the new line with a break tag
  function replaceWithBreak(text) {
    if (typeof text !== "string") return ""; // Check if text is a string
    return text.replace(/\n/g, "<br />");
  }

  // returns an error page if the result object is empty
  if (JSON.stringify(result) === "{}") {
    return <ErrorPage />;
  }

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
export default Resume;
