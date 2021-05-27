var express = require('express');
var bodyParser = require('body-parser');
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const AWS = require('aws-sdk');

// declare a new express app
var app = express();

app.use(
    bodyParser.json({
        limit: '50mb',
    })
);

app.use(
    bodyParser.urlencoded({
        limit: '50mb',
        parameterLimit: 100000,
        extended: true,
    })
);

// app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

app.post('/api', function (req, res) {
    const rekognition = new AWS.Rekognition();

    let body = req.body;

    const sourceImage = encodeURIComponent(body.image);
    const imageBuffer = Buffer.from(decodeURIComponent(sourceImage), 'base64');

    var params = {
        Image: {
            Bytes: imageBuffer,
            // Bytes: Buffer.from(body.image) || "STRING_VALUE",
        },
        SummarizationAttributes: {
            MinConfidence: '90',
            RequiredEquipmentTypes: ['FACE_COVER'],
        },
    };
    rekognition.detectProtectiveEquipment(params, function (err, data) {
        if (err)
            res.json({
                success: 'Error!',
                url: req.url,
                err: err,
                stack: err.stack,
            }).status(400);
        else {
            var conElemento = 0;
            var sinElemento = 0;
            var conElementoMalPuesto = 0;
            const personas = data.Persons.length;
            if (data.Persons != null) {
                data.Persons.forEach((person) => {
                    if (person.BodyParts[0].EquipmentDetections.length == 0) {
                        sinElemento = sinElemento + 1;
                    } else if (
                        person.BodyParts[0].EquipmentDetections[0]
                            .CoversBodyPart.Value
                    ) {
                        conElemento = conElemento + 1;
                    } else {
                        conElementoMalPuesto = conElementoMalPuesto + 1;
                    }
                });
            }
            res.json({
                personas,
                conElemento,
                sinElemento,
                conElementoMalPuesto,
            }).status(200);
        }
    });
});

app.listen(3000, function () {
    console.log('App started');
});

module.exports = app;
