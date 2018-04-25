const express = require('express');
const app = express();
const cors = require('cors');
const mongodb = require("mongodb");
const ObjectID = require('mongodb').ObjectID;
const passwordHash = require('password-hash');
let db;
//////////////////////////////
const url = "mongodb://localhost:27017/project-db";

app.set('port', (process.env.PORT || 5000));
app.use(cors({
                 origin     : true,
                 credentials: true
             }));

mongodb.MongoClient.connect(
    process.env.MONGODB_URI || url,
    (err, database) =>
    {
        if (err)
            return console.log(err);

        db = database.db('project-db');
        console.log(`connected`);

    }
);

app.get(
    '/',
    (request, response) =>
    {
        response.send('All right');
    }
);

app.get(
    '/api/concert/:id',
    (request, response) =>
    {
        const collection = db.collection('concerts');
        const id = ObjectID.createFromHexString(request.params.id);

        collection.findOne({_id: id}, (err, document) =>
        {
            response.send(document);
        });

    }
);

app.get(
    '/api/concerts',
    (request, response) =>
    {
        let collection = db.collection('concerts');
        collection.find({}).toArray((err, results) => response.send(results));
    }
);

app.listen(
    app.get('port'),
    () => console.log('Node app is running on port', app.get('port'))
);
