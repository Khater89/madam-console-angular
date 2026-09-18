import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
let ai = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const contents = [];
    if (Array.isArray(history) && history.length > 0) {
      contents.push(...history);
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    let response = null;
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.6-flash'];
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: 'You are an intelligent assistant integrated into the Madama Group Marketing & Campaign Console. You help marketing teams plan schedules, manage orders, draft copy, and answer questions concisely and politely.'
          }
        });
        if (response && response.text) {
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Attempt with ${model} failed:`, err.message || err);
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to generate response');
    }

    res.json({ text: response.text || '' });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, '127.0.0.1', () => {
  console.log(`[API Server] Listening on http://127.0.0.1:${port}`);
});
