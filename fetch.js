const MongoClient = require("mongodb").MongoClient;
const uri =
  "mongodb+srv://homework:homeworkmarket@cluster0-2k7v0.mongodb.net/<dbname>?retryWrites=true&w=majority";

const dbName = "rachael";
const connect = () => {
  return new Promise((resolve, reject) => {
    MongoClient.connect(
      uri,
      { useNewUrlParser: true, useUnifiedTopology: true },
      (err, client) => {
        err ? reject(err) : resolve(client);
      }
    );
  });
};

const fetchLinks = async () => {
  console.log("fetching links");
  let client = await connect();
  const db = client.db(dbName);
  const collection = db.collection("posts");
  let posts = await new Promise((resolve, reject) => {
    collection
      .find({})
      .sort({ $natural: -1 })
      .project({ content: 0, title: 0 })
      .toArray((err, data) => {
        err ? reject(err) : resolve(data);
      });
  });

  let posted = posts.map((i) => i._id);

  console.log("Fetched " + posted.length);

  let links = await new Promise((resolve, reject) => {
    db.collection("links")
      .find()
      .toArray((err, data) => {
        err ? reject(err) : resolve(data);
      });
  });
  client.close();
  console.log("Links " + links.length);
  const unfetched = links.filter((i) => !posted.includes(i._id));
  console.log("unfetched " + unfetched.length);
  return unfetched.slice(0, 100);
};

const fetchPosts = async () => {
  let client = await connect();
  const collection = client.db(dbName).collection("posts");

  let links = await new Promise((resolve, reject) => {
    collection
      .find({ posted: { $exists: false }, date: { $exists: true } })
      .sort({ date: -1 })
      .limit(100)
      .toArray((err, data) => {
        err ? reject(err) : resolve(data);
      });
  });
  client.close();
  console.log("Fetched " + links.length + " links");
  return links;
};

const addPosts = async (client, posts) => {
  // let client = await connect();
  let collection = client.db(dbName).collection("posts");
  try {
    collection.insertMany(posts, { ordered: false });
  } catch (error) {}
};

const addPost = async (db, post) => {
  try {
    db.collection("posts").insertOne(post);
  } catch (error) {
    console.log(error);
  }
};

const markPosted = async (db, link) => {
  const collection = db.collection("links");
  collection.findOneAndUpdate({ _id: link }, { $set: { posted: true } });
};

markPublished = async (db, post) => {
  const collection = db.collection("posts");
  collection.findOneAndUpdate({ _id: post._id }, { $set: { posted: true } });
};
module.exports = {
  fetchLinks,
  fetchPosts,
  markPosted,
  connect,
  addPosts,
  addPost,
  markPublished,
};
