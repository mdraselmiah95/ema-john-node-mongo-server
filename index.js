const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Ema john server is Running");
});

app.listen(port, () => {
  console.log("Server is running at port", port);
});
