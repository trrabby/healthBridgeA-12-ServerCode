const express = require('express');

const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 8000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

app.use(
  cors({
    origin: [
      "http://localhost:5173", "https://healthbridge-3fca1.web.app", "https://healthbridgea-12.netlify.app"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser())

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};
//localhost:5000 and localhost:5173 are treated as same site.  so sameSite value must be strict in development server.  in production sameSite will be none
// in development server secure will false .  in production secure will be true


// Verify Token
const verifyToken = (req, res, next) => {
  const token = req?.cookie?.token
  // no token
  if (!token) {
    return res.status(401.).send({ messsage: "unauthorized access" })
  }
  // if token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" })
    }
    req.user = decoded;
    next()
  })
}

//creating Token
app.post("/jwt", async (req, res) => {
  const user = req.body;
  // console.log("user for token", user);
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1d'
  });
  // console.log(token)
  res.cookie("token", token, cookieOptions).send({ success: true });
});

//clearing Token
app.post("/logout", async (req, res) => {
  const user = await req.body;
  console.log("logging out", user);
  res
    .clearCookie("token", { ...cookieOptions, maxAge: 0 })
    .send({ success: true });
});

// create-payment-intent
app.post('/create-payment-intent', async (req, res) => {
  // console.log(req.body)
  const price = req.body.price
  const priceInCent = parseFloat(price) * 100
  if (!price || priceInCent < 1) return
  // generate clientSecret
  const { client_secret } = await stripe.paymentIntents.create({
    amount: priceInCent,
    currency: 'usd',
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {
      enabled: true,
    },
  })
  // send client secret as response
  res.send({ clientSecret: client_secret })
})

app.get('/', (req, res) => {
  res.send('Server is running')
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

// const uri = "mongodb://localhost:27017"; 
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.xygzlb8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const database = client.db("HealthBridge");
    const itemCollection = database.collection("Users");
    const itemCollection2 = database.collection("Camps");
    const itemCollection3 = database.collection("regCamps");
    const itemCollection4 = database.collection("paymentInfo");
    const itemCollection5 = database.collection("feedback");

    // User related apis
    app.get('/user', async (req, res) => {

      try {
        const cursor = itemCollection.find()
        const result = await cursor.toArray();
        res.send(result)
      }
      catch (error) {
        console.log(error)
      }

    })

    app.get('/user/:email', async (req, res) => {

      try {
        const email = req.params.email;
        const query = { user_email: email };
        const result = await itemCollection.findOne(query);
        res.send(result);
      }
      catch (error) {
        console.log(error)
      }
    })

    app.post('/user', async (req, res) => {
      const item = req.body;
      console.log(item)

      try {
        const result = await itemCollection.insertOne(item);
        res.send(result);
      }
      catch (err) {
        console.log(err)
      }
    });

    // Camp related apis
    app.post('/camps', async (req, res) => {
      const item = req.body;

      try {
        const result = await itemCollection2.insertOne(item);
        res.send(result);
      }
      catch (err) {
        console.log(err)
      }
    });

    app.get('/camps', async (req, res) => {

      try {
        const cursor = itemCollection2.find().sort({ _id: -1 })
        const result = await cursor.toArray();
        res.send(result)
      }
      catch (error) {
        console.log(error)
      }

    })

    app.get('/campsDataLengthPagination', async (req, res) => {

      try {
        const cursor = itemCollection2.find()
        const result = await cursor.toArray();
        res.send(result)
      }
      catch (error) {
        console.log(error)
      }

    })

    // ManageCamps Pagination
    app.get('/campsDataPagination', async (req, res) => {

      // Parse query parameters and ensure they are numbers
      const page = parseInt(req.query.page) || 0;
      const size = parseInt(req.query.size) || 10;

      const result = await itemCollection2.find().sort({ _id: -1 })
        .skip(page * size)
        .limit(size)
        .toArray();

      // Send the result back to the client
      res.send(result);

    })

    // sorting apis
    app.get('/mostReg', async (req, res) => {

      try {
        const cursor = itemCollection2.find().sort({ "participantCount": -1 })
        const result = await cursor.toArray();
        res.send(result)
      }
      catch (error) {
        console.log(error)
      }

    })

    app.get('/camp_fee', async (req, res) => {

      try {
        const cursor = itemCollection2.find().sort({ "campFee": -1 })
        const result = await cursor.toArray();
        res.send(result)
      }
      catch (error) {
        console.log(error)
      }

    })

    app.get('/Alphabetical_Order', async (req, res) => {

      try {
        const cursor = itemCollection2.find().sort({ "title": 1 })
        const result = await cursor.toArray();
        res.send(result)
      }
      catch (error) {
        console.log(error)
      }

    })

    // Closing of sorting api
    //      ------------------------------------------

    app.get('/camps/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await itemCollection2.findOne(query);
      res.send(result);
    })

    app.patch('/campss/:id', async (req, res) => {
      const id = req.params.id
      const updateInfo = req.body
      // console.log(updateInfo, id)
      const filter = { _id: new ObjectId(id) };
      // const options = { upsert: true };
      const updateDoc = {
        $set: { ...updateInfo },
      }
      const result = await itemCollection2.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.delete('/camps/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      try {
        const result = await itemCollection2.deleteOne(query);
        res.send(result);
      }
      catch (err) {
        console.log(err)
      }

    })

    /* API to search text from title */
    app.get('/camps-search/:value', async (req, res) => {
      const text = (req.params.value)

      try {
        const query = {
          $or: [
            { title: new RegExp(text, 'i') },
            { campFee: new RegExp(text) },
            { startDate: new RegExp(text, 'i') },
            { loc: new RegExp(text, 'i') },
            { healtCareProf: new RegExp(text, 'i') },
          ]
        }
        const result = await itemCollection2.find(query).toArray();
        res.send(result)
      }
      catch (err) {
        console.log(err)
      }

    })



    // regCamps

    app.post('/regCamps', async (req, res) => {
      const item = req.body;

      try {
        const result = await itemCollection3.insertOne(item);
        res.send(result);
      }
      catch (err) {
        console.log(err)
      }
    });

    app.get('/regCamps', async (req, res) => {
      const cursor = itemCollection3.find()
      try {
        const result = await cursor.toArray();
        res.send(result)
      }
      catch (error) {
        console.log(error)
      }

    })

    app.get('/regCamps/:regCampId', async (req, res) => {
      const regCampId = req.params.regCampId;
      const query = { regCampId };
      const result = await itemCollection3.find(query).toArray();
      res.send(result);
    })

    app.get('/regCamps_default/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      try {
        const result = await itemCollection3.findOne(query);
        res.send(result);
      }
      catch (err) {
        console.log(err)
      }

    })

    // myRegCamps for count
    app.get('/myRegCampsCount/:emailOfParticipant', async (req, res) => {
      try {
        // Log the query parameters for debugging
        // console.log(req.query);

        const emailOfParticipant = req.params.emailOfParticipant;
        const query = { emailOfParticipant };
        const result = await itemCollection3.find(query).toArray();

        res.send(result);
      } catch (err) {
        // Log any errors and send a server error response
        console.error(err);
        res.status(500).send({ error: 'An error occurred while fetching data.' });
      }
    });


    // myRegCamps for pagination
    app.get('/myRegCamps/:emailOfParticipant', async (req, res) => {
      try {
        // Log the query parameters for debugging
        // console.log(req.query);

        // Parse query parameters and ensure they are numbers
        const page = parseInt(req.query.page) || 0;
        const size = parseInt(req.query.size) || 10;

        // Get the email of the participant from the route parameters
        const emailOfParticipant = req.params.emailOfParticipant;

        // Construct the query
        const query = { emailOfParticipant };

        // Fetch data from the collection with pagination
        const result = await itemCollection3.find(query).sort({ _id: -1 })
          .skip(page * size)
          .limit(size)
          .toArray();

        // Send the result back to the client
        res.send(result);
      } catch (err) {
        // Log any errors and send a server error response
        console.error(err);
        res.status(500).send({ error: 'An error occurred while fetching data.' });
      }
    });

    app.put('/regCamps_default/:id', async (req, res) => {
      const id = req.params.id;
      const doc = req.body;
      // console.log(doc, id)

      const filter = { _id: new ObjectId(id) };
      // const options = { upsert: true };
      const updateDoc = {
        $set: { ...doc }
      }
      const result = await itemCollection3.updateOne(filter, updateDoc)
      res.send(result)
    })


    app.delete('/regCamps/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      try {
        const result = await itemCollection3.deleteOne(query);
        res.send(result);
      }
      catch (err) {
        console.log(err)
      }

    })
    // ManageAllRegCamps Pagination

     app.get('/regCampsPagination', async (req, res) => {

      // Parse query parameters and ensure they are numbers
      const page = parseInt(req.query.page) || 0;
      const size = parseInt(req.query.size) || 10;

      const result = await itemCollection3.find().sort({ _id: -1 })
        .skip(page * size)
        .limit(size)
        .toArray();

      // Send the result back to the client
      res.send(result);

    })


    // Feedback

    app.post('/feedback', async (req, res) => {
      const item = req.body;

      try {
        const result = await itemCollection5.insertOne(item);
        res.send(result);
      }
      catch (err) {
        console.log(err)
      }
    });

    app.get('/feedback', async (req, res) => {
      const cursor = itemCollection5.find()
      try {
        const result = await cursor.sort({_id: -1}).toArray();
        res.send(result)
      }
      catch (error) {
        console.log(error)
      }

    })

    app.get('/feedback/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      try {
        const result = await itemCollection5.findOne(query);
        res.send(result);
      }
      catch (err) {
        console.log(err)
      }

    })




    // Transaction Details

    app.post('/paymentInfo', async (req, res) => {
      const item = req.body;

      try {
        const result = await itemCollection4.insertOne(item);
        res.send(result);
      }
      catch (err) {
        console.log(err)
      }
    });

    app.get('/paymentInfo', async (req, res) => {
      const cursor = itemCollection4.find()
      try {
        const result = await cursor.toArray();
        res.send(result)
      }
      catch (error) {
        console.log(error)
      }

    })

    app.get('/paymentInfo/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      try {
        const result = await itemCollection4.findOne(query);
        res.send(result);
      }
      catch (err) {
        console.log(err)
      }

    })

    app.put('/paymentInfo_up/:id', async (req, res) => {
      const id = req.params.id;
      const doc = req.body;
      console.log(doc, id)

      const filter = { keyAfterPayment: id };
      // const options = { upsert: true };
      const updateDoc = {
        $set: { ...doc }
      }
      const result = await itemCollection4.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.get('/paymentInfoBy/:email', async (req, res) => {
      const email = req.params.email;
      const query = { emailOfParticipant: email };

      try {
        const result = await itemCollection4.find(query).toArray();
        res.send(result);
      }
      catch (err) {
        console.log(err)
      }

    })

    // myPayment for pagination
    app.get('/paymentInfoByCount/:email', async (req, res) => {
      try {
        // Log the query parameters for debugging
        // console.log(req.query);

        // Parse query parameters and ensure they are numbers
        const page = parseInt(req.query.page) || 0;
        const size = parseInt(req.query.size) || 10;

        // Get the email of the participant from the route parameters
        const email = req.params.email;

        // Construct the query
        const query = { emailOfParticipant: email };

        // Fetch data from the collection with pagination
        const result = await itemCollection4.find(query).sort({ _id: -1 })
          .skip(page * size)
          .limit(size)
          .toArray();

        // Send the result back to the client
        res.send(result);
      } catch (err) {
        // Log any errors and send a server error response
        console.error(err);
        res.status(500).send({ error: 'An error occurred while fetching data.' });
      }
    });





    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }

  finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
