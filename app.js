var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var testRouter = require('./routes/test');
var usersRouter = require('./routes/users');
require('dotenv').config();

var app = express();
// perform actions on the collection object
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb://${process.env.DBUSER}:${process.env.DBPASSWORD}@${process.env.DBHOST}/${process.env.DB}`;
const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();
    const db = client.db(process.env.DB);

    app.use('/', indexRouter);

    // test Router for testing health, database connection, and post
    app.use('/test/', (req, res, next) => {
      req.db = db;
      next();
    }, testRouter);

    app.use('/users/', (req, res, next) => {
      req.db = db;
      next();
    }, usersRouter);

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
      next(createError(404));
    });

    // error handler
    app.use(function(err, req, res, next) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.json({error : err});
    });
  } catch (e) {
    console.error(e);
  }
}

main().catch(console.err);


module.exports = app;
