import express from "express";

const app = express();
const PORT = 5000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running on port 5000");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});