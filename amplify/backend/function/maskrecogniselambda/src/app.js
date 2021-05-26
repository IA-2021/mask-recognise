/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

var express = require("express");
var bodyParser = require("body-parser");
var awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
const AWS = require("aws-sdk");

// declare a new express app
var app = express();

app.use(bodyParser.json({
  limit: '50mb'
}));

app.use(bodyParser.urlencoded({
  limit: '50mb',
  parameterLimit: 100000,
  extended: true 
}));

// app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});



app.post("/api", function (req, res) {
  // Add your code here
  const rekognition = new AWS.Rekognition();
  
  let body = req.body

  const sourceImage = encodeURIComponent(body.image)
  const imageBuffer = Buffer.from(decodeURIComponent(sourceImage),'base64')

  var params = {
    Image: {
      Bytes: imageBuffer,
      // Bytes: Buffer.from(body.image) || "STRING_VALUE",
    },
    SummarizationAttributes: {
      MinConfidence: "90",
      RequiredEquipmentTypes: ["FACE_COVER"],
    },
  };
  rekognition.detectProtectiveEquipment(params, function (err, data) {
    if (err)
      res.json({ success: "Error!", url: req.url, err: err, stack: err.stack });
    else res.json({ success: "get call succeed!", url: req.url, data: data }); // successful response
  });

});

app.listen(3000, function () {
  console.log("App started");
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
