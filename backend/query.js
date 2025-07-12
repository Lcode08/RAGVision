import dotenv from "dotenv";
import OpenAI from "openai";
import pineconeIndex from "./utils/pinecone.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function queryMovies(userQuery) {
  // Step 1: Embed the user's question
  const queryEmbeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: userQuery,
    dimensions: 1024,
  });

  const queryEmbedding = queryEmbeddingRes.data[0].embedding;

  // Step 2: Search Pinecone with embedding
  const searchResult = await pineconeIndex.query({
    vector: queryEmbedding,
    topK: 5,
    includeMetadata: true,
  });

  // Step 3: Return results
  return searchResult.matches.map((match) => match.metadata);
}


const userQuestion = process.argv[2]; 
if (!userQuestion) {
  console.log("❌ Please provide a query, e.g.:\nnode query.js \"sci-fi thrillers\"");
  process.exit(1);
}

queryMovies(userQuestion).then((results) => {
  console.log("🔍 Top Matches:");
  results.forEach((movie, i) => {
    console.log(`${i + 1}. ${movie.title} (${movie.year}) - ${movie.genres} - ⭐ ${movie.rating}`);
  });
});
