
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , projects = require('./routes/projects')
  , conversations = require('./routes/conversations')
  , messages = require('./routes/messages')
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
app.get('/:student/projects', projects.list);
app.post('/:student/projects', projects.post);

app.options('/:student/projects/:id', projects.list);
app.get('/:student/projects/:id', projects.list);
app.put('/:student/projects/:id', projects.put);

app.options('/:student/conversations/:id', conversations.get);
app.get('/:student/conversations/:id', conversations.get);
app.put('/:student/conversations/:id', conversations.put);
app.options('/:student/projects/:id/conversations', conversations.list);
app.post('/:student/projects/:id/conversations', conversations.post);

app.options('/:student/messages/:id', messages.get);
app.get('/:student/messages/:id', messages.get);
app.options('/:student/projects/:id/conversations/:convId/messages', messages.list);
app.post('/:student/projects/:id/conversations/:convId/messages', messages.post);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
