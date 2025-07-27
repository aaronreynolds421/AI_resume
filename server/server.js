require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const database = [];
const { OpenAI } = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});
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
const Bottleneck = require("bottleneck"); // Install bottleneck: npm install bottleneck
const limiter = new Bottleneck({
  minTime: 1000, // 1 second between requests
  maxConcurrent: 1,
});

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
Create a resume for ${fullName}, ${currentPosition}, with ${currentLength} years using ${currentTechnologies}.
Work History: ${workHistoryString}
Return JSON:
- "description": 100-word first-person summary.
- "points": 10 skill strings.
- "companies": Array of {name, description (50 words, first-person)} per company.
`;
  const maxRetries = 3;
  let retryCount = 0;

  async function attemptApiCall() {
    try {
      console.log("Calling OpenAI API at:", new Date().toISOString());
      const response = await limiter.schedule(() =>
        openai.chat.completions.create({
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a professional resume writer.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
        })
      );

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("OpenAI response content is empty");
      }
      console.log("OpenAI response content:", content);
      console.log("API usage:", response.usage); // Log token usage
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
        if (
          !parsedContent.description ||
          !parsedContent.points ||
          !parsedContent.companies
        ) {
          throw new Error("Incomplete JSON structure from OpenAI");
        }
      } catch (error) {
        console.error("Error parsing OpenAI response:", error.message);
        throw new Error("Failed to parse resume data");
      }
      return parsedContent;
    } catch (error) {
      console.error("GPTFunction error:", error.message, error.stack);
      if (
        error.response &&
        error.response.status === 429 &&
        retryCount < maxRetries
      ) {
        if (error.response.data?.error?.message?.includes("current quota")) {
          console.error(
            "Quota depleted. Regenerate API key or upgrade plan: https://platform.openai.com/account/billing"
          );
          throw new Error("Failed to generate resume: Quota exceeded");
        }
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000;
        console.error(
          `Rate limit exceeded, retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return attemptApiCall();
      }
      throw new Error(`Failed to generate resume: ${error.message}`);
    }
  }

  return attemptApiCall();
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
