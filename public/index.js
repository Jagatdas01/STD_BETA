const functions = require("firebase-functions")
const express = require("express")

/* Express */
const app = express()
app.get("*", (request, response) => {
  response.send("Hello from Express on Firebase Test 1!")
})

exports.app = functions.https.onRequest(app);