/*
 * CONVERSATIONS resources 
 */

'use strict';

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';

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

  if (!req.get('Content-Type') || req.get('Content-Type').indexOf('application/json') === -1) {
    res.send(400, 'You must set the Content-Type header to "application/json"');
    return;
  }

  var query = {
    "_id" : new BSON.ObjectID(req.params.id)
  };

  var newConversation = {
    "subject" : req.body.subject,
    "messages" : [],
    "_id" : new BSON.ObjectID().toString()
  };

  geekwise.synchronousUpdate('projects', query, {
    $push : {
      conversations : newConversation
    }
  }).then(function (count) {
    return geekwise.queryProjects(query);
  }).then(function (project) {
    var conversation = _.findWhere(project[0].conversations, { '_id' : newConversation._id });

    res.send(201, conversation);
  });
};

exports.get = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  var query = {
    "conversations._id" : req.params.id
  };

  geekwise.queryProjects(query)
    .then(function (project) {
      var conversation = _.findWhere(project[0].conversations, { '_id' : req.params.id });

      res.send(200, conversation);
    });
};

exports.put = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  if (!req.get('Content-Type') || req.get('Content-Type').indexOf('application/json') === -1) {
    res.send(400, 'You must set the Content-Type header to "application/json"');
    return;
  }

  var q = {
    "conversations._id" : req.params.id
  };

  if (!_.has(req.body, 'subject')) {
    res.send(400, "Must contain 'subject' in request body.");
    return;
  }

  geekwise.queryProjects(q)
    .then(function (projects) {
      var project = projects[0];

      var conversations = _.map(project.conversations, function (conversation) {
        if (conversation._id === req.params.id) {
          conversation.subject = req.body.subject;
        }
        return conversation;
      });

      return geekwise.synchronousPut('projects', q, { conversations: conversations });
    }).then(function () {
      return geekwise.queryProjects(q);
    }).then(function (project) {
      var conversation = _.findWhere(project[0].conversations, { '_id' : req.params.id });

      res.send(200, conversation);
    });
};

exports.remove = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  var q = {
    "conversations._id" : req.params.id
  };

  geekwise.queryProjects(q)
    .then(function (projects) {
      var project = projects[0];

      var conversationToRemove = _.findWhere(project.conversations, { "_id" : req.params.id });

      var conversations = _.without(project.conversations, conversationToRemove);

      return geekwise.synchronousUpdate('projects', q, { $set : { conversations: conversations } });
    }).then(function () {
      res.send(204);
    });
};