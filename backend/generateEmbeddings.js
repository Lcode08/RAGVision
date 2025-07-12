import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import OpenAI from "openai";
import pineconeIndex from "./utils/pinecone.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const db = new sqlite3.Database("./db/movies.db");

function getAllMovies() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM movies", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const chunkArray = (array, size) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

async function generateAndUploadEmbeddings() {
  const movies = await getAllMovies();
  const chunks = chunkArray(movies, 100);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const vectors = [];

    for (const movie of chunk) {
      const inputText = `${movie.title} (${movie.year}) - Genres: ${movie.genres}`;

      try {
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: inputText,
          dimensions: 1024, // ✅ MATCHES YOUR INDEX DIMENSIONS
        });

        const embedding = response.data[0].embedding;

        vectors.push({
          id: movie.id,
          values: embedding,
          metadata: {
            title: movie.title,
            year: movie.year,
            genres: movie.genres,
            rating: movie.rating,
            votes: movie.votes,
          },
        });

        await sleep(200); // 🕒 prevent throttling
      } catch (err) {
        console.error(`⚠️ Embedding failed for ${movie.title}:`, err.message || err);
      }
    }

    try {
      if (vectors.length > 0) {
        await pineconeIndex.upsert(vectors);
        console.log(`✅ Uploaded ${vectors.length} vectors (chunk ${i + 1}/${chunks.length})`);
      }
    } catch (err) {
      console.error("❌ Failed to upsert to Pinecone:", err.message || err);
      console.log("⏳ Retrying in 5s...");
      await sleep(5000); // Retry after delay
      i--; // Retry same chunk
    }
  }

  db.close();
  console.log("🎉 All embeddings inserted successfully!");
}

generateAndUploadEmbeddings();
