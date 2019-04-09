var Request = require("request");
const functions = require('firebase-functions');
const { WebhookClient, Suggestion, Table, Image, Button, Card } = require('dialogflow-fulfillment');
const { dialogflow, Permission } = require('actions-on-google');
const express = require("express");
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
var routes = require('./routes/index');

// initialise DB connection
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
var test = require("./addtask.js");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://smarttodo-abc88.firebaseio.com/"
});


process.env.DEBUG = 'dialogflow:debug';

// Wikipedia link and image URLs
const wikipediaTemperatureUrl = 'https://en.wikipedia.org/wiki/Temperature';
const mytestUrl = 'https://us-central1-smarttodo-abc88.cloudfunctions.net/app/';
const wikipediaTemperatureImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/2/23/Thermally_Agitated_Molecule.gif';

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  const app = dialogflow({
	clientId: "951904381429-l1sp1nebjbr88cmoah9unrhkfrm39tvj.apps.googleusercontent.com"
  });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
	
  function handleTest1(agent) {
    agent.add(`Thank you...Jagat`);
    return admin.database().ref('task').once("value").then((snapshot) => {
      var taskName = snapshot.child("taskName").val();
      agent.add(`your task name is ` + taskName);
      agent.add(new Suggestion(`Show me`));
      agent.add(new Card({
        title: 'Vibrating molecules',
        imageUrl: wikipediaTemperatureImageUrl,
        text: 'Did you know that temperature is really just a measure of how fast molecules are vibrating around?! 😱',
        buttonText: 'Temperature Wikipedia Page',
        buttonUrl: mytestUrl
      })
      );
      return taskName;
    }, (error, isSuccess) => {
      console.log('success: ' + isSuccess);
    });

  }

  function handleTest2(agent) {
    agent.add(`Bye...Jagat`);
    return admin.database().ref('task').transaction((task) => {
      if (task !== null) {
        task.taskName = task.taskName + `task updated with test comment`;
        agent.add(task.taskName);
      }
      else {
        agent.add(`task not updated ` + task.taskName);
      }
      return task;
    }, (error, isSuccess) => {
      console.log('success: ' + isSuccess);
    });

  }

  let intentMap = new Map();
  intentMap.set('Test1', handleTest1);
  intentMap.set('Test2', handleTest2);
  agent.handleRequest(intentMap);
});

var app = express();
routes(app);
app.engine('.hbs', expressHbs({ defaultLayout: 'layout', extname: '.hbs' }));
app.set('view engine', '.hbs');

exports.app = functions.https.onRequest(app);
