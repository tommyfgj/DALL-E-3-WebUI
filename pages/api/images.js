import { OpenAIApi, Configuration } from 'openai';

export default async function handler(req, res) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const response = await openai.createImage({
    prompt: req.query.p,
    n: parseInt(req.query.n),
    size: "1024x1024",
  });
  console.log(response.data.data);
  res.status(200).json({ result: response.data.data })
}
