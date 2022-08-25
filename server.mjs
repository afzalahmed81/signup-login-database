import express from "express";
import cors from "cors";
// import { nanoid } from 'nanoid';
import mongoose from 'mongoose';
import { stringToHash, varifyHash, } from "bcrypt-inzi"

const app = express();
app.use(express.json());
app.use(cors());


const port = process.env.PORT || 3000;

// let userBase = [];

//Now create an users with database.

const userSchema = new mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true },
    password: { type: String, required: true },
    age: { type: Number, min: 17, max: 65, default: 18 },
    isMarried: { type: Boolean, default: false },
    createdOn: { type: Date, default: Date.now },
});
const userModel = mongoose.model('Users', userSchema);





//Signup Database
app.post("/signup", (req, res) => {


    let body = req.body;

    if (!body.firstName || !body.lastName || !body.email || !body.password) {
        //Status(400) is use for bad request (Client Error).
        res.status(400).send(
            `required fields missing, request example: 
                {
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "abc@abc.com",
                    "password": "12345"
                }`
        );
        return;
    }



    // Query for Email user . Check if user already exsis

    userModel.findOne({ email: body.email }, (err, data) => {
        if (!err) {
            console.log("data: ", data);

            if (data) { // user already exist
                console.log("user already exist: ", data);
                res.status(400).send({ message: "user already exist,please try a different email" });
                return;
            }
            else {
                stringToHash(body.password).then(hashString => {

                    let newUser = new userModel({
                        firstName: body.firstName,
                        lastName: body.lastName,
                        email: body.email.toLowerCase(),
                        password: hashString
                    });

                    // save the users to database .save retrue two things error or result.

                    newUser.save((err, result) => {
                        if (!err) {
                            // status(201) is used to send succeed message;
                            res.status(201).send({ message: "user is created" });
                            console.log("saved: ", result);
                        }
                        else {
                            // status(500) is used to show sever error.
                            res.status(500).send({ message: "error found" });
                            console.log("error: ", err);
                        }
                    });
                })

            }
        }
        else {
            console.log("db error: ", err);
            res.status(500).send({ message: "db error in query" });
        }
    });
});


app.get("/users", async (req, res) => {

    try {
        let allUser = await userModel.find({}).exec();
        res.send(allUser);

    } catch (error) {
        res.status(500).send({ message: "error getting users" });
    }
})



//Login Database

// app.post("/login", (req, res) => {

//     userModel.findOne({ email: body.email, password: body.password }, (err, data) => {


//         let body = req.body;

//         if (!body.email || !body.password) {
//             res.status(400).send(
//                 `Required fields missing, Request example:
//     {
//         "email": "abc@abc.com",
//         "password": "12345"
//     }`
//             );
//             return;
//         }
//         if (userModel.email === body.email) {
//             if (userModel.password === body.password) {
//                 res.status(200).send({
//                     firstName: userModel.firstName,
//                     lastName: userModel.lastName,
//                     email: userModel.email,
//                     message: "login successful"
//                 })
//                 return;

//             } else {

//                 res.status(401).send({
//                     message: "incorrect password"
//                 })
//                 return;
//             }
//         }
//     });
// });
app.post("/login", (req, res) => {

    let body = req.body;

    if (!body.email || !body.password) { // null check - undefined, "", 0 , false, null , NaN
        res.status(400).send(
            `required fields missing, request example: 
                {
                    "email": "abc@abc.com",
                    "password": "12345"
                }`
        );
        return;
    }

    let isFound = false; // https://stackoverflow.com/a/17402180/4378475

    for (let i = 0; i < userModel.length; i++) {
        if (userModel[i].email === body.email) {

            isFound = true;
            if (userModel[i].password === body.password) { // correct password

                res.status(200).send({
                    firstName: userModel[i].firstName,
                    lastName: userModel[i].lastName,
                    email: userModel[i].email,
                    message: "login successful",
                    token: "some unique token"
                })
                return;

            } else { // password incorrect

                res.status(401).send({
                    message: "incorrect password"
                })
                return;
            }
        }
    }

    if (!isFound) {
        res.status(404).send({
            message: "user not found"
        })
        return;
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)

})

//////////////////////////////////////////

// mongodb credentials, username: afzal81,     password:afz ,    cluster name : Cluster0
// mongodb+srv://afzal81:<password>@cluster0.9tmbp5a.mongodb.net/?retryWrites=true&w=majority

let dburI = 'mongodb+srv://afzal81:afz@cluster0.9tmbp5a.mongodb.net/demoUserBase?retryWrites=true&w=majority';
mongoose.connect(dburI);
////////////////mongodb connected disconnected events///////////////////////////////////////////////
mongoose.connection.on('connected', function() {//connected
    console.log("Mongoose is connected");
});

mongoose.connection.on('disconnected', function() {//disconnected
    console.log("Mongoose is disconnected");
    process.exit(1);
});

mongoose.connection.on('error', function(err) {//any error
    console.log('Mongoose connection error: ', err);
    process.exit(1);
});

process.on('SIGINT', function() {/////this function will run jst before app is closing
    console.log("app is terminating");
    mongoose.connection.close(function() {
        console.log('Mongoose default connection closed');
        process.exit(0);
    });
});
////////////////mongodb connected disconnected events///////////////////////////////////////////////







