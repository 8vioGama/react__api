'use strict';
var AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});
var rekognition = new AWS.Rekognition();
var s3 = new AWS.S3();
var fs = require('fs');

function base64Encode(file) {
  var bitmap = fs.readFileSync(file);
  return new Buffer(bitmap).toString('base64');
}

module.exports = function(app) {
  var Account = app.models.Account;

  app.post('/login', function(req, res) {
    console.log('req', req.body);
    Account.login({
      email: req.body.email,
      password: req.body.password,
    }, 'user', function(err, token) {
      if (err) {
        res.status(500).json({error: err});
        return;
      }
      res.send(JSON.stringify({ // login user and return json
        email: req.body.email,
        accessToken: token.id,
      }));
    });
  });

  app.post('/upload', function(req, res) {
    var date = new Date();
    var year = date.getFullYear();

    var user = req.body.user ? req.body.user.id : 'test';
    var stream = fs.createReadStream('server/boot/Recibo-luz.jpg');

    var params = {
      Bucket: 'energywatchertest',
      Key: 'ew_' + year + '-' + user + '.jpg',
      Body: req.body.stream ? req.body.stream : stream,
    };

    s3.upload(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      res.send(JSON.stringify({
        data: data,
      }));
    });
  });

  app.post('/detectText', function(req, res) {
    var params = {
      Image: { /* required */
        S3Object: {
          Bucket: req.body.bucket,
          Name: req.body.name,
        },
      },
    };
    rekognition.detectText(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);
      res.send(JSON.stringify({
        recognition: data,
      }));        // successful response
    });
  });
};
