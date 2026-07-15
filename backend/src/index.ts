import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import * as admin from 'firebase-admin';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin (Assuming you provide service account details via env vars or default credentials)
// admin.initializeApp({ credential: admin.credential.applicationDefault() });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Example Gemini Endpoint (keeps API key secure on the backend)
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    
    res.json({ result: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
