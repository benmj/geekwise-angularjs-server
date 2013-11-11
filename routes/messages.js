/*
 * MESSAGES
 */

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/mydb';

var mongo = require('mongodb'),
  BSON = mongo.BSONPure;

var _ = require('underscore');
var Q = require('q');

var geekwise = require('../shared/synchronous.js');

exports.list = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  res.send(200);
};

exports.post = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  if (!_.has(req.body, "user")) {
    res.send("400", "Request body must include field 'user'");
    return;
  }

  var query = {
    "conversations._id" : req.params.convId
  };

  var newMessage = {
    "message": req.body.message || '',
    "created": new Date(),
    "modified" : new Date(),
    "_id" : new BSON.ObjectID().toString()
  };

  geekwise.getUser(req.body.user)
    .then(function (user) {
      newMessage.user = user[0];

      return geekwise.queryProjects(query);
    }).then(function (projects) {
      var project = projects[0];

      var conversations = _.map(project.conversations, function (conversation) {
        if (conversation._id === req.params.convId) {
          conversation.messages.push(newMessage);
        }

        return conversation;
      });

      return geekwise.synchronousUpdate('projects', query, { $set : { "conversations" : conversations } });
    }).then(function (count) {
      return geekwise.queryProjects({ "conversations._id" : req.params.convId });
    }).then(function (projects) {
      var message = _.chain(projects[0].conversations)
        .pluck('messages')
        .flatten()
        .findWhere({ '_id' : newMessage._id })
        .value();

      if (message) {
        res.send(200, message);
      } else {
        res.send(500, "Whaaat?");
      }
    });
};

exports.put = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  var query = {
    "conversations.messages._id" : req.params.id
  };

  geekwise.queryProjects(query)
    .then(function (projects) {
      var project = projects[0];

      var conversations = _.map(project.conversations, function (conversation) {
        conversation.messages = _.map(conversation.messages, function (message) {
          if (message._id === req.params.id) {
            message.message = req.body.message || '';
            message.modified = new Date();
          }
          return message;
        });
        return conversation;
      });
      return geekwise.synchronousPut('projects', query, { conversations: conversations });
    })
    .then(function (count) {
      return geekwise.queryProjects(query);
    }).then(function (projects) {
      var message = _.chain(projects[0].conversations)
        .pluck('messages')
        .flatten()
        .findWhere({ '_id' : req.params.id })
        .value();

      if (message) {
        res.send(200, message);
      } else {
        res.send(404);
      }
    });
};

exports.get = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  var query = {
    "_student" : req.params.student,
    "conversations.messages._id" : req.params.id
  };

  var message = {};

  geekwise.queryProjects(query)
    .then(function (project) {
      message = _.chain(project[0].conversations)
        .pluck('messages')
        .flatten()
        .findWhere({ '_id' : req.params.id })
        .value();

      if (!message) {
        res.send(404);
      } else {
        res.send(message);
      }
    });
};
