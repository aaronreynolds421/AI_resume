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
    cb(null, 'uploads/'); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Unique filename
  }
});
const upload = multer({ storage: storage });


async function GPTFunction({
  fullName,
  currentPosition,
  currentLength,
  currentTechnologies,
  workHistory,
}) {
  const workHistoryString = JSON.parse(workHistory)
    .map((job, i) => `Job ${i + 1}: ${job.position} at ${job.name}`)
    .join("\n");

  const prompt = `
Generate a professional resume for the following person:

Name: ${fullName}
Current Position: ${currentPosition}
Years in Position: ${currentLength}
Technologies: ${currentTechnologies}
Work History:
${workHistoryString}

Only include relevant and professional resume content.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4", // or "gpt-3.5-turbo"
    messages: [
      { role: "system", content: "You are a professional resume writer." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}

app.post("/api/resume", upload.single("headshotImage"), async (req, res) => {
  const {
    fullName,
    currentPosition,
    currentLength,
    currentTechnologies,
    workHistory,
  } = req.body;
  const imagePath = req.file?.path;

  if (!fullName || !currentPosition) {
    return res.status(400).json({ message: "missing required fields" });
  }
  const headshotPath = req.file ? req.file.path : null;
  const workArray = JSON.parse(workHistory);
  const newEntry = {
    id: generateID(),
    fullName,
    image_url: `http://localhost:5000/uploads/${req.file.filename}`,
    currentPosition,
    currentLength,
    currentTechnologies,
    workHistory: workArray,
    headshotPath
  };
  

  //Prompts to pass to the gpt function

  const prompt1 = `I am writing a resume, my dtails are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n I write in the technolegies: ${currentTechnologies}. Can you write a 100 words description for the top of the resume(first person writing)?`; //the backticks allow for multiline strings
  const prompt2 = `I am writing a resume, my dtails are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n I write in the technolegies: ${currentTechnologies}. Can you write 10 points for a resume on what I am good at?`;
  const remainderText = () => {
    let stringText = "";
    for (let i = 0; i < workArray.length; i++) {
      stringText += ` ${workArray[i].name} as a ${workArray[i].position}.`;
    }
    return stringText;
  }; //this loops throught the workarray and converts it into a string
  const prompt3 = `I am writing a resume, my dtails are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n During my years I worked at ${
    workArray.length
  } companies. ${remainderText()} \n Can you write me 50 words for each company in numbers of my succession in the company (in first person)?`;
  //this generates the result

  const objectives = await GPTFunction(prompt1);
  const kPoints = await GPTFunction(prompt2);
  const jobResp = await GPTFunction(promtp3);

  // creates an object

  const chatgptData = { objectives, kPoints, jobResp };
  const data = { ...newEntry, ...chatgptData };
  database.push(data);

  res.json({
    message: "Request successful!",
    data,
  });
});
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
