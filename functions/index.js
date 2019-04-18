const functions = require('firebase-functions');
var Request = require("request");
const {
  dialogflow,
  SignIn,
  BasicCard,
  Image,
  SimpleResponse,
  Suggestion
} = require("actions-on-google");
const express = require("express");
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
var routes = require('./routes/index');

// initialise DB connection
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://***************.firebaseio.com/"
});

process.env.DEBUG = 'dialogflow:debug';

// Wikipedia link and image URLs
const wikipediaTemperatureUrl = 'https://en.wikipedia.org/wiki/Temperature';
const mytestUrl = 'https://us-central1-smarttodo-abc88.cloudfunctions.net/app/';
const wikipediaTemperatureImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/2/23/Thermally_Agitated_Molecule.gif';

const app = dialogflow({
  clientId: "************************"
});

app.intent("Start_Signin", conv => {
  conv.ask(new SignIn("To personalize"));
});

// Getting data from firebase realtime database
app.intent("Test1", conv => {
  conv.ask(new SimpleResponse({
    speech: 'Getting your sample database',
    text: `Getting your sample database`,
  }));
  return admin.database().ref('task').once("value").then((snapshot) => {
    var taskName = snapshot.child("taskName").val();
    conv.add(`your task name is ` + taskName);
    conv.add(new Suggestion(`Show me`));
    conv.add(new Card({
      title: 'Vibrating molecules',
      imageUrl: wikipediaTemperatureImageUrl,
      text: 'Did you know that temperature is really just a measure of how fast molecules are vibrating around?! 😱',
      buttonText: 'Temperature Wikipedia Page',
      buttonUrl: mytestUrl
    })
    );
    return taskName;
  },(error, isSuccess) => {
    console.log('success: ' + isSuccess);
  });
});

app.intent("Test2", conv => {
  conv.add(`Hi Jagat`);
  return admin.database().ref('task').transaction((task) => {
    if (task !== null) {
      task.taskName = task.taskName + `task updated with test comment`;
      conv.add(task.taskName);
    }
    else {
      conv.add(`task not updated ` + task.taskName);
    }
    return task;
  }, (error, isSuccess) => {
    console.log('success: ' + isSuccess);
  });
});

app.intent("Get_Signin", (conv, params, signin) => {
  if (signin.status === "OK") {
    const payload = conv.user.profile.payload;
    conv.ask(new SimpleResponse({
      speech: 'Howdy, this is GeekNum',
      text: `Howdy! I can tell you fun fact , ${payload.name}`,
    }));
  } else {
    conv.ask(new SimpleResponse({
      speech: 'Howdy, this is GeekNum',
      text: `Howdy! I can tell you fun fact `,
    }));
  }
});

app.intent("Show_User_Profile", conv => {
  const payload = conv.user.profile.payload;
  if (payload) {

    const userId = payload.aud;
    const name = payload.name;
    const givenName = payload.given_name;
    const familyName = payload.family_name;
    const email = payload.email;
    const emailVerified = payload.email_verified;
    const picture = payload.picture;

    conv.ask("This is your profile information.");
    conv.ask(new BasicCard({
      text: `ID:${userId}  
      Name:${name}  
      Given name:${givenName}  
      Family name:${familyName}  
      Email:${email}  
      Email verified:${emailVerified}`,
      image: new Image({
        url: picture,
        alt: "Profile Image"
      })
    }));
  } else {
    conv.ask("Not signed in yet.");
    conv.ask(new Suggestion("want to sign in"));
  }
});

app.intent('Default Fallback Intent', (conv) => {
  console.log(conv.data.fallbackCount);
  if (typeof conv.data.fallbackCount !== 'number') {
    conv.data.fallbackCount = 0;
  }
  conv.data.fallbackCount++;
  // Provide two prompts before ending beetodo
  if (conv.data.fallbackCount === 1) {
    conv.contexts.set(Contexts.ONE_MORE, 2);
    return conv.ask(new SimpleResponse("I didn't get that ."));
  } else if (conv.data.fallbackCount === 2) {
    return conv.ask(new SimpleResponse("Falling back."));
  }
  return conv.close("This isn't working.Have a good day. Bye! ");
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);

var apprest = express();
routes(apprest);
apprest.engine('.hbs', expressHbs({ defaultLayout: 'layout', extname: '.hbs' }));
apprest.set('view engine', '.hbs');

exports.apprest = functions.https.onRequest(apprest);
