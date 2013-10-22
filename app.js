
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , mongo = require('mongodb');

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';

mongo.Db.connect(mongoUri, function (err, db) {
  db.collection('users', function(er, collection) {
    collection.insert({
    			"_student": "Ben",
                "firstName": "John",
                "lastName": "Doe",
                "nickName": "Jonny Boy",
                "email": "jonny@example.com"
            }, {safe: true}, function(er,rs) {

    });
  });
});

mongo.Db.connect(mongoUri, function (err, db) {
  db.collection('projects', function(er, collection) {
    collection.insert({
    			"_student": "Ben",
		    	"title": "Top secret Acme project",
				"description": "The details of this project are so disturbing, we can't even describe them.",
				"status": "working on it",
            }, {safe: true}, function(er,rs) {

    });
  });
});

mongo.Db.connect(mongoUri, function (err, db) {
  db.collection('conversations', function(er, collection) {
    collection.insert({
    			"_student": "Ben",
				"subject": "Gotta go to work",
            }, {safe: true}, function(er,rs) {

    });
  });
});


var app = express();

// all environments
app.set('port', process.env.PORT || 5000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
