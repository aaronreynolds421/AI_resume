require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const database = [];
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const multer = require("multer");
const path = require("path");
const fs = require("fs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(cors({ origin: "http://localhost:3000" }));

const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
  console.log("Created uploads folder at", uploadPath);
}
const generateID = () => Math.random().toString(36).substring(2, 10);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});
const upload = multer({ storage: storage }).fields([
  { name: "headshotImage", maxCount: 1 },
  { name: "fullName", maxCount: 1 },
  { name: "currentPosition", maxCount: 1 },
  { name: "currentLength", maxCount: 1 },
  { name: "currentTechnologies", maxCount: 1 },
  { name: "workHistory", maxCount: 1 },
]);

async function GPTFunction({
  fullName = "Unknown",
  currentPosition = "N/A",
  currentLength = "N/A",
  currentTechnologies = "None",
  workHistory = "[]",
}) {
  console.log("Entering GPTFunction at:", new Date().toISOString());
  console.log("GPTFunction received inputs:", {
    fullName,
    currentPosition,
    currentLength,
    currentTechnologies,
    workHistory,
  });

  let workHistoryString = " No work history provided";
  let workArray = [];
  try {
    if (
      workHistory &&
      typeof workHistory === "string" &&
      workHistory.trim() !== ""
    ) {
      workArray = JSON.parse(workHistory);
      if (Array.isArray(workArray) && workArray.length > 0) {
        workHistoryString = workArray
          .map(
            (job, i) =>
              `Job ${i + 1}: ${job.position || "Unknown"} at ${
                job.name || "Unknown"
              }`
          )
          .join("\n");
      } else {
        console.warn("workHistory is not a valid array:", workHistory);
      }
    }
  } catch (error) {
    console.error("Error parsing workHistory:", error.message, error.stack);
  }

  const prompt = `
Generate a professional resume for the following person:

Name: ${fullName}
Current Position: ${currentPosition}
Years in Position: ${currentLength}
Technologies: ${currentTechnologies}
Work History:
${workHistoryString}

Return a JSON object with the following fields:
- "description": A 100-word description for the top of the resume (first person).
- "points": An array of 10 strings listing what the person is good at.
- "companies": An array of objects with "name" and "description" (50 words each, first person) for each company in the work history.
`;

  try {
    console.log("Calling OpenAI API at:", new Date().toISOString());
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Switched to lighter model to reduce quota usage
      messages: [
        { role: "system", content: "You are a professional resume writer." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI response content is empty");
    }
    console.log("OpenAI response content:", content);
    return JSON.parse(content);
  } catch (error) {
    console.error("GPTFunction error:", error.message, error.stack);
    if (error.response && error.response.status === 429) {
      console.error(
        "Rate limit exceeded. Please check your OpenAI plan at https://platform.openai.com/account/billing"
      );
    }
    throw new Error("Failed to generate resume");
  }
}

app.post("/api/resume", upload, async (req, res) => {
  console.log("Received /api/resume request at:", new Date().toISOString());
  console.log("Request headers:", req.headers);
  console.log("Request body:", req.body);
  console.log("Request files:", req.files);
  console.log("Extracted workHistory:", req.body.workHistory);

  const {
    fullName = "Unknown",
    currentPosition = "N/A",
    currentLength = "N/A",
    currentTechnologies = "None",
    workHistory = "[]",
  } = req.body || {};

  let workArray = [];
  try {
    if (
      workHistory &&
      typeof workHistory === "string" &&
      workHistory.trim() !== ""
    ) {
      workArray = JSON.parse(workHistory);
      if (!Array.isArray(workArray)) {
        console.warn("workHistory is not a valid array:", workHistory);
        workArray = [];
      }
    }
  } catch (error) {
    console.error("Error parsing workHistory:", error.message, error.stack);
    workArray = [];
  }
  const headshotPath = req.files?.headshotImage?.[0]?.path || null;
  const image_url = req.files?.headshotImage?.[0]?.filename
    ? `http://localhost:5000/uploads/${req.files.headshotImage[0].filename}`
    : null;

  const newEntry = {
    id: generateID(),
    fullName,
    image_url,
    currentPosition,
    currentLength,
    currentTechnologies,
    workHistory: workArray,
    headshotPath,
  };

  console.log("newEntry created:", newEntry);

  //Prompts to pass to the gpt function

  //const prompt1 = `I am writing a resume, my dtails are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n I write in the technolegies: ${currentTechnologies}. Can you write a 100 words description for the top of the resume(first person writing)?`; //the backticks allow for multiline strings
  // const prompt2 = `I am writing a resume, my dtails are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n I write in the technolegies: ${currentTechnologies}. Can you write 10 points for a resume on what I am good at?`;
  // const remainderText = () => {
  //   let stringText = "";
  ////   for (let i = 0; i < workArray.length; i++) {
  //     stringText += ` ${workArray[i].name} as a ${workArray[i].position}.`;
  //    }
  //   return stringText;
  //  }; //this loops throught the workarray and converts it into a string
  // const prompt3 = `I am writing a resume, my dtails are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n During my years I worked at ${
  //    workArray.length
  //  } companies. ${remainderText()} \n Can you write me 50 words for each company in numbers of my succession in the company (in first person)?`;
  //this generates the result

  // const objectives = await GPTFunction(prompt1);
  // const kPoints = await GPTFunction(prompt2);
  // const jobResp = await GPTFunction(promtp3);

  // creates an object

  // const chatgptData = { objectives, kPoints, jobResp };
  ///  const data = { ...newEntry, ...chatgptData };
  //database.push(data);

  // res.json({
  //   message: "Request successful!",
  //   data,
  try {
    console.log("Calling GPTFunction");
    const chatgptData = await GPTFunction({
      fullName,
      currentPosition,
      currentLength,
      currentTechnologies,
      workHistory,
    });
    const data = { ...newEntry, ...chatgptData };
    database.push(data);

    res.json({
      message: "Request successful!",
      data,
    });
  } catch (error) {
    console.error("Error in /api/resume:", error.message, error.stack);
    res
      .status(500)
      .json({ error: "Failed to generate resume", details: error.message });
  }
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
