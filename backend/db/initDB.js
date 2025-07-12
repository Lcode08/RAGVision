import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as csv from "fast-csv";
import sqlite3 from "sqlite3";

// Enable __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const basicsPath = path.join(__dirname, "../data/title.basics.tsv");
const ratingsPath = path.join(__dirname, "../data/title.ratings.tsv");

// SQLite DB connection
const db = new sqlite3.Database(path.join(__dirname, "movies.db"));

// Create the movies table
db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS movies`);
  db.run(`
    CREATE TABLE movies (
      id TEXT PRIMARY KEY,
      title TEXT,
      year TEXT,
      genres TEXT,
      rating REAL,
      votes INTEGER
    )
  `);
});

const ratingsMap = new Map();

// Step 1: Load ratings.tsv into memory
fs.createReadStream(ratingsPath)
  .pipe(csv.parse({ headers: true, delimiter: "\t", quote: '"' }))
  .on("error", (error) => console.error("❌ Ratings parse error:", error))
  .on("data", (row) => {
    ratingsMap.set(row.tconst, {
      rating: parseFloat(row.averageRating),
      votes: parseInt(row.numVotes),
    });
  })
  .on("end", () => {
    console.log("✅ Loaded ratings into memory.");

    const insert = db.prepare(`
      INSERT INTO movies (id, title, year, genres, rating, votes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let count = 0;

    // Step 2: Read title.basics.tsv and insert filtered rows into SQLite
    fs.createReadStream(basicsPath)
      .pipe(csv.parse({ headers: true, delimiter: "\t", quote: null }))
      .on("error", (error) => console.error("❌ Basics parse error:", error))
      .on("data", (row) => {
        const rating = ratingsMap.get(row.tconst);

        if (
          row.titleType === "movie" &&
          row.primaryTitle !== "\\N" &&
          row.startYear !== "\\N" &&
          row.genres !== "\\N" &&
          rating &&
          rating.votes > 50000
        ) {
          insert.run(
            row.tconst,
            row.primaryTitle,
            row.startYear,
            row.genres,
            rating.rating,
            rating.votes
          );
          count++;
        }
      })
      .on("end", () => {
        insert.finalize();
        db.close();
        console.log(`✅ Done! Inserted ${count} popular movies into movies.db`);
      });
  });
