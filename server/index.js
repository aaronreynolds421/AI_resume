const express = require("express");
const cors = require("cors");
const app = express();
const port = 4000;
const database = [];
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey:
    "<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></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>",
});

const openai = new OpenAIApi(configuration);

const GPTFunction = async (text) => {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: text,
    temperature: 0.6,
    max_tokens: 250,
    top_p: 1,
    frequency_penalty: 1,
    presence_penalty: 1,
  });
  return response.data.choices[0].text;
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.get("/api", (req, res) => {
  res.json({
    message: "Hello World",
  });
});
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
app.post("/resume/create", upload.single("headshotImage"), async (req, res) => {
  const {
    fullName,
    currentPosition,
    currentLength,
    currentTechnologies,
    workHistory,
  } = req.body;

  const workArray = JSON.parse(workHistory);
  const newEntry = {
    id: generateID(),
    fullName,
    image_url: `http://localhost:4000/uploads/${req.file.filename}`,
    currentPosition,
    currentLength,
    currentTechnologies,
    workHistory: workArray,
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

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
});
