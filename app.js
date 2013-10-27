
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , projects = require('./routes/projects')
  , http = require('http')
  , path = require('path')
  , mongo = require('mongodb');

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';

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
app.options('/:student/users', user.list);
app.options('/:student/users/:id', user.list);

app.get('/:student/users', user.list);
app.get('/:student/users/:id', user.list);
app.post('/:student/users', user.post);
app.delete('/:student/users/:id', user.delete);
app.put('/:student/users/:id', user.put);

app.options('/:student/projects', projects.list);
app.options('/:student/projects:id', projects.list);
app.get('/:student/projects', projects.list);
app.get('/:student/projects:id', projects.list);
app.post('/:student/projects', projects.post);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
