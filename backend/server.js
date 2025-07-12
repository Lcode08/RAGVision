import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import pineconeIndex from './utils/pinecone.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Set up CORS to allow Vercel frontend
const allowedOrigins = [
  'https://techonsy-rag-chatbot.vercel.app', // ✅ Your deployed frontend
  'http://localhost:5173', // ✅ For local dev (optional)
];
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 Movie RAG backend is running!");
});

app.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required." });

    // Step 1: Get embedding of user's query
    const queryEmbeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      dimensions: 1024,
    });

    const queryEmbedding = queryEmbeddingRes.data[0].embedding;

    // Step 2: Search Pinecone
    const searchResult = await pineconeIndex.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });

    const matchedMovies = searchResult.matches.map((match, i) => {
      const { title, year, genres, rating } = match.metadata;
      return `${i + 1}. ${title} (${year}) - ${genres} - ⭐ ${rating}`;
    });

    const context = matchedMovies.join("\n");

    // Step 3: Let GPT generate final answer
    const prompt = `You are a helpful movie assistant. Based on these 5 movies:\n\n${context}\n\nAnswer the user's question: "${query}" in 2-3 lines.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const finalAnswer = completion.choices[0].message.content;
    res.json({ answer: finalAnswer });

  } catch (err) {
    console.error("❌ Error processing query:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend server is running at http://localhost:${PORT}`);
});
