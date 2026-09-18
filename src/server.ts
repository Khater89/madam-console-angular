import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { CommonEngine } from '@angular/ssr';
import bootstrap from './main.server';

export const app = express();
app.use(express.json());

const apiKey = process.env['GEMINI_API_KEY'];
let ai: GoogleGenAI | null = null;
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

app.post('/api/chat', async (req, res): Promise<void> => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    if (!ai) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      return;
    }
    
    const contents: any[] = [];
    if (Array.isArray(history) && history.length) {
      contents.push(...history);
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    let response: any = null;
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.6-flash'];
    let lastError: any = null;

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
        console.warn(`Attempt with ${model} failed:`, err);
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to generate response');
    }

    res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = resolve(browserDistFolder, 'index.html');

app.use(express.static(browserDistFolder, {
  maxAge: '1y',
  index: false
}));

const commonEngine = new CommonEngine();

app.get('{*splat}', (req, res, next) => {
  const { protocol, originalUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: 'serverUrl', useValue: `${protocol}://${headers.host}` }],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

export const reqHandler = app;

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server.mjs') || 
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server.js')
);

if (isDirectRun) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, () => {
    console.log(`[Production Server] Listening on port ${port}`);
  });
}
