
// Our initial setup (package requires, port number setup)
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/user');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
require('dotenv').config()
const PORT = process.env.PORT || 5005 // So we can run on heroku || (OR) localhost:5000




const cors = require('cors') // Place this with other requires (like 'path' and 'express')
const corsOptions = 
{
    origin: "https://cse341-samuelosekeny.herokuapp.com/",
    optionsSuccessStatus: 200
};

const options = 
{
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    family: 4
};

const MONGODB_URL = process.env.MONGODB_URL || "mongodb+srv://ose1:Maling49@cluster0.unrpp.mongodb.net/shop?retryWrites=true&w=majority";
                      

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URL,
  collection: 'sessions'
});

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file,cb)=> {
    cb(null, 'images');
  },
  filename: (req,file,cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if(file.mimetype === "image/png" || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
    cb(null,true);
  }else {
    cb(null,false);
  } 
};

app.use(bodyParser.urlencoded({extended: false})); // For parsing the body of a POST
app.use(bodyParser.json()); 
app.use(multer({storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(session({secret: 'my secret', resave: false, saveUninitialized: false, store: store}));
app.use(csrfProtection);
app.use(flash());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  next();
})

app.use((req, res, next)=> {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
 });

app.use(cors(corsOptions));

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if(!user) {
        return next();
      }
      req.user = user;
      next();
    })
    // .catch(err => console.log(err));
    .catch(err => {
      next(new Error(err));
      // throw new Error(err);
    });
});

// Route setup. You can implement more in the future!
const routes = require('./routes');
const errorController = require('./Controllers/error');

//app.get('/500', errorController.get500);
app
   .use(express.static(path.join(__dirname, 'public')))
   .use('/images',express.static(path.join(__dirname, 'images')))
   .set('views', path.join(__dirname, 'views'))
   .set('view engine', 'ejs')
   
   .use('/', routes)
   .get('/', (req, res, next) => {
     // This is the primary index, always handled last. 
     res.render('pages/index', {title: 'Welcome to my CSE341 repo', path: '/'});
    })

    .use(errorController.get404)
    .use((error,req, res, next) => {
      console.log(error);
      res.render('pages/500', 
      {pageTitle:'Error!', 
      path: req.url, 
      isAuthenticated:req.session.isLoggedIn})
    })
   
    //session middleware  
mongoose.connect(MONGODB_URL, options)
  .then(result => {
    const server = app.listen(PORT);
    const io = require ('socket.io')(server);
    io.on('connection', socket => {
      socket.on('broadcast', data => {
        socket.broadcast.emit('broadcast', data)
      })
    })  
  })
  .catch(err => {
    console.log(err);
  });
