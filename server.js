const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongodb = require("mongodb");
const ObjectID = require('mongodb').ObjectID;
const passwordHash = require('password-hash');
const passport = require("passport");
const passportJWT = require("passport-jwt");

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

let db;

const jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = 'tasmanianDevil';

const strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next)
{
    console.log('payload received', jwt_payload);

    const collection = db.collection('users');

    const id = ObjectID.createFromHexString(jwt_payload._id);

    collection.findOne({_id: id}, (err, user) =>
    {
        console.log(user);
        if (user)
        {
            next(null, user);
        }
        else
        {
            next(null, false);
        }
    });

});

passport.use(strategy);

//////////////////////////////
const url = "mongodb://localhost:27017/project-db";

app.set('port', (process.env.PORT || 5000));
app.use(cors({
                 origin     : true,
                 credentials: true
             }));

app.use(passport.initialize());

app.use(bodyParser.urlencoded({
                                  extended: true
                              }));

app.use(bodyParser.json());

//mongodb.MongoClient.connect(
  //  process.env.MONGODB_URI || url,
    //(err, database) =>
    //{
     //   if (err)
       //     return console.log(err);

     //   db = database.db('project-db');
       // console.log(`connected`);

    //}
//);

app.get(
    '/',
    (request, response) =>
    {
        response.send('All right');
    }
);

app.post("/api/login", function (req, res)
{
    console.log(req.body.login, req.body.password);
    if (req.body.login && req.body.password)
    {
        const login = req.body.login;

        console.log(req.body.login, req.body.password);
        const collection = db.collection('users');

        collection.findOne({login: login}, (err, user) =>
        {
            if (!user)
            {
                res.status(401).json({message: "no such user found"});
                return;
            }
            //console.log(user);

            if (passwordHash.verify(req.body.password, user.hash))
            {
                // from now on we'll identify the user by the id and the id is the only personalized value that goes into our token
                const payload = {_id: user._id};
                console.log(payload);
                const token = jwt.sign(payload, jwtOptions.secretOrKey);
                res.json({message: "ok", token: token});
            }
            else
            {
                res.status(401).json({message: "passwords did not match"});
            }
        })
    }
});

app.post("/api/register", function (req, res)
{
    if (req.body.login && req.body.password && req.body.email && req.body.name && req.body.surname)
    {
        const login = req.body.login;
        const hash = passwordHash.generate(req.body.password);
        const email = req.body.email;
        const name = req.body.name;
        const surname = req.body.surname;

        const collection = db.collection('users');

        collection.insertOne({
                                 'name'   : name,
                                 'surname': surname,
                                 'email'  : email,
                                 'login'  : login,
                                 'hash'   : hash
                             }).then(() =>
                                     {
                                         collection.findOne({login: login}, (err, user) =>
                                         {

                                             if (user)
                                             {
                                                 const payload = {_id: user._id};
                                                 console.log(payload);
                                                 const token = jwt.sign(payload, jwtOptions.secretOrKey);
                                                 res.json({message: "ok", token: token});
                                             }
                                             else
                                             {
                                                 res.send(err);
                                             }
                                         });
                                     });
    }
});

app.get("/api/user", passport.authenticate('jwt', {session: false}), function (req, res)
{
    res.send(req.user);
});

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
