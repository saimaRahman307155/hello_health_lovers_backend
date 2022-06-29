const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient } = require('mongodb');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const fileUpload = require('express-fileupload');
// middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

//database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wvpgl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
  try {
    await client.connect();
    console.log('database connected');
    const database = client.db('img_pay');
    const usersCollection = database.collection('users');
    const dietChatCollection = database.collection('dietChat');

    //add user
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      //console.log(result);
      res.json(result);
    });
    //make admin
    app.put('/users/admin', async (req, res) => {
      const user = req.body;
      //console.log('put', user);
      const filter = { email: user.email };
      const updateDoc = { $set: { role: 'admin' } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    //secure admin
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === 'admin') {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
    //user profile information
    app.put('/users', async (req, res) => {
      // console.log('body', req.body);
      // console.log('files', req.files);
      const userName = req.body.name;
      const userEmail = req.body.email;
      const filter = { email: userEmail };
      const userPhoneNumber = req.body.phoneNumber;
      const userAddress = req.body.address;
      const status = req.body.status;
      const userProfliePic = req.files.profilePictute;
      const profilePicData = userProfliePic.data;
      const encodedProfilePic = profilePicData.toString('base64');
      const profilePicBuffer = Buffer.from(encodedProfilePic, 'base64');
      const photo = {
        userName,
        userEmail,
        userPhoneNumber,
        userAddress,
        status,
        profilePictute: profilePicBuffer
      }
      const updateDoc = { $set: photo };
      const result = await usersCollection.updateOne(filter, updateDoc);
      //console.log(result);
      res.json(result);
    });
    //get profile picture
    app.get('/users', async (req, res) => {
      const cursor = usersCollection.find({});
      const profile = await cursor.toArray();
      //console.log(profile);
      res.json(profile);
    });
    //save bmi data
    app.post('/savebmi', async (req, res) => {
      const data = req.body;
      const result = await dietChatCollection.insertOne(data);
      console.log(result);
      res.json(result);
    });
    //get bmi data for user
    app.get('/savebmi', async (req, res) => {
      const cursor = dietChatCollection.find({});
      const profile = await cursor.toArray();
      //console.log(profile);
      res.json(profile);
    });
    //delete user bmi data 
    app.delete('/savebmi/:id', async(req,res)=>{
      const id = req.params.id;
      const query = { _id : ObjectId(id) };
      const result = await dietChatCollection.deleteOne(query);
      //console.log('deleting id', result);
      res.json(result);
    });
    //delete user by admin 
    app.delete('/users/:id', async(req,res)=>{
      const id = req.params.id;
      const query = { _id : ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      //console.log('deleting id', result);
      res.json(result);
    });
  }
  finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('hello heath lovers');
});

app.listen(port, () => {
  console.log('Running Server on port', port);
})