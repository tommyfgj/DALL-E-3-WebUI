import { OpenAI } from 'openai';
import {ZodNull} from "zod";
const { OpenAIClient, AzureKeyCredential, GetImagesOptions } = require("@azure/openai");
import {logtoClient} from '../../lib/logto'

export default logtoClient.withLogtoApiRoute((request, response) => {
  if (process.env.LOGTO_ENABLE === "true" && !request.user.isAuthenticated) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  handler(request, response);
});

export async function handler(req, res) {
    const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const azure_openai = new OpenAIClient(process.env.AZURE_ENDPOINT, new AzureKeyCredential(process.env.OPENAI_API_KEY));

  const { p: prompt, n, s: size, q: quality, st: style } = req.query;
  if (!prompt || !n || !size || !quality || !style) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  let response;
  if (process.env.AZURE_ENDPOINT) {
    const opt = {n: parseInt(n), size, quality, style}
    console.log("use azure", process.env.AZURE_MODEL, prompt, opt);
    response = await azure_openai.getImages(process.env.AZURE_MODEL, prompt, opt);
  } else {
    response = await openai.images.generate({
      prompt,
      n: parseInt(n),
      size,
      model: 'dall-e-3',
      quality,
      style,
    });
  }

  console.log("rsp: ", response.data);
  res.status(200).json({ result: response.data });
}
