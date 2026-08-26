const mongoose = require('mongoose');
require ('dotenv').config();
mongoose.connect(process.env.Mongo_url)
    .then(() => {
        console.log("mongodb connected questionschema");
    })
    .catch(() => {
        console.log("fail.connect questionschema");
    })


    const questionSchema = new mongoose.Schema({
        title: {
            type: String,
            required: true,
        },
        link: {
            type: String,
            unique: true,
            required: true
        },
        topics: {
            type: [String]
        },
        solution: {
            type: String,
            required: true,
        }
    });
    

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;