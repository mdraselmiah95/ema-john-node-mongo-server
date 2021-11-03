const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
var admin = require("firebase-admin");

//middleware
app.use(cors());
app.use(express.json());

//firebase admin
var serviceAccount = require("./ema-john-simple-ac815-firebase-adminsdk-ifv7m-af36c2e5dc.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rzfie.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verityToken(req, res, next) {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    const idToken = req.headers.authorization.split("Bearer ")[1];
    try {
      const decodedUser = await admin.auth().verifyIdToken(idToken);
      req.decodedUserEmail = decodedUser.email;
    } catch {}
  }
  next();
}

//main function
async function run() {
  try {
    await client.connect();
    const database = client.db("online_Shop");
    const productCollection = database.collection("products");
    const orderCollection = database.collection("orders");
    //GET Products API
    app.get("/products", async (req, res) => {
      //   console.log(req.query);
      const cursor = productCollection.find({});
      const page = req.query.page;
      const size = parseInt(req.query.size);
      let products;
      const count = await cursor.count();
      if (page) {
        products = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        products = await cursor.toArray();
      }

      //   const products = await cursor.limit(10).toArray();

      res.send({ count, products });
    });

    //Use POST to get data by keys
    app.post("/products/keys", async (req, res) => {
      const keys = req.body;
      const query = { key: { $in: keys } };
      const products = await productCollection.find(query).toArray();
      res.json(products);
    });

    //Add Orders API
    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      if (req.decodedUserEmail === email) {
        const query = { email: email };
        const cursor = orderCollection.find({ query });
        const orders = await cursor.toArray();
        res.json(orders);
      } else {
        res.status(401).json({ massage: "User not authorized" });
      }
    });

    app.post("/orders", async (req, res) => {
      const order = req.body;
      order.createdAt = new Date();
      const result = await orderCollection.insertOne(order);
      res.json(result);
      //   res.send("order process");
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Ema john server is Running");
});

app.listen(port, () => {
  console.log("Server is running at port", port);
});
