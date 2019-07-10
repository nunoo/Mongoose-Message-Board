const express = require('express');
const app = express();
const server = app.listen(9000);
const io = require('socket.io')(server);
var path = require("path");
var bodyParser = require('body-parser');
var session = require('express-session');
const flash = require('express-flash')
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/messageboard', {
    useNewUrlParser: true
});
mongoose.Promise = global.Promise;

app.use(express.static(__dirname + "/static"));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(flash());

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "It's Over 9000!",
    saveUninitialized: true,
    resave: false,
    cookie: {
        maxAge: 60000
    }
}))

//===================================================================
// Schemas
//===================================================================

const CommentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name must be 2 characters long'],
        minlength: 2
    },
    comment: {
        type: String,
        required: [true, 'Enter a Comment'],
        minlength: 2
    },

}, {
    timestamps: true
})

const MessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name must be 2 characters long'],
        minlength: 2
    },
    message: {
        type: String,
        required: [true, 'Enter a Message'],
        minlength: 2
    },
    comment: [CommentSchema]
}, {
    timestamps: true
})

mongoose.model('Comment', CommentSchema);
mongoose.model('Message', MessageSchema);
var Comment = mongoose.model('Comment');
var Message = mongoose.model('Message');


//===================================================================
// Route to render and show index
//===================================================================


app.get('/', (req, res) => {
    Message.find({}, (err, msg_arr, com_arr) => {
        if (err) {
            console.log('error!!!!', err)
        } else {
            console.log(msg_arr)
            res.render('index', {
                messages: msg_arr,
                comments: com_arr,
            })
        }
    })
})


app.post('/addmsg', (req, res) => {
    console.log('POST DATA', req.body);
    Message.create(req.body, (err, data) => {
        if (err) {
            console.log('something went wrong', err)
            for (var key in err.errors) {
                req.flash('reg', err.errors[key].message)
            }
            res.redirect('/')
        } else {
            console.log('successfully added a message')
            res.redirect('/')
        }
    })
})

app.post('/addcomment', (req, res) => {
    console.log('POST DATA', req.body);
    Comment.create(req.body, (err, data) => {
        if (err) {
            console.log('something went wrong', err)
            for (var key in err.errors) {
                req.flash('reg', err.errors[key].message)
            }
            res.redirect('/')
        } else {
            Message.findOneAndUpdate({
                _id: req.body.msg_id
            }, {
                $push: {
                    comment: data
                }
            },(err, data) => {
                if (err) {
                    console.log("Error adding comment to message", err.message)
                    res.redirect("/")
                } else {
                    console.log("Successfully added comment to message")
                    res.redirect("/")
                }
            })
        }
    })
})



app.get('*', (req, res) => {
    res.send("404 not a valid URL")
});