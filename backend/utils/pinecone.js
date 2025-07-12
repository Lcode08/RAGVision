import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

// ✅ Minimal config for serverless: ONLY apiKey needed
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);

export default pineconeIndex;
