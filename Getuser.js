'use strict';

var express = require('express');
var logger = require('connect-logger');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var fs = require('fs');
var crypto = require('crypto');
var rest = require('restler');

var AuthenticationContext = require('adal-node').AuthenticationContext;

var app = express();
app.use(logger());
app.use(cookieParser('a deep secret'));

app.use(session({
    secret: 'ConsoleApp',
    name: 'AzureManager',
    resave: true,
    saveUninitialized: true
})); 
var token;

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

var sampleParameters = {
  tenant : 'b61277f8-b558-4627-95a3-bc6ba7af8d45',
  authorityHostUrl : 'https://login.windows.net',
  clientId : '254577a7-7a7c-4d98-bd76-ff8fdfd4a73d',
  username : '254577a7-7a7c-4d98-bd76-ff8fdfd4a73d',
  password : 'YQ8UpRT2ijDq84p47926Eek/epSbXaX8UrQxI2s/nbY=',
  clientSecret : 'YQ8UpRT2ijDq84p47926Eek/epSbXaX8UrQxI2s/nbY='
};


var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;
var redirectUri = 'http://rajgraphapi.azurewebsites.net/getAToken';
var resource = '00000002-0000-0000-c000-000000000000';

var templateAuthzUrl = 'https://login.windows.net/' + sampleParameters.tenant + '/oauth2/authorize?response_type=code&client_id=<client_id>&redirect_uri=<redirect_uri>&state=<state>&resource=<resource>';

app.get('/', function(req, res) {
  res.cookie('acookie', 'this is a cookie');
  res.redirect('/auth');
});

app.get('/app',function(req,res){
	res.render('user.html');
});

function createAuthorizationUrl(state) {
  var authorizationUrl = templateAuthzUrl.replace('<client_id>', sampleParameters.clientId);
  authorizationUrl = authorizationUrl.replace('<redirect_uri>',redirectUri);
  authorizationUrl = authorizationUrl.replace('<state>', state);
  authorizationUrl = authorizationUrl.replace('<resource>', resource);
  return authorizationUrl;
}

app.get('/auth', function(req, res) {
  crypto.randomBytes(48, function(ex, buf) {
    var token = buf.toString('base64').replace(/\//g,'_').replace(/\+/g,'-');

    res.cookie('authstate', token);
    var authorizationUrl = createAuthorizationUrl(token);

    res.redirect(authorizationUrl);
  });
});


app.get('/getAToken', function(req, res) {
  if (req.cookies.authstate !== req.query.state) {
    res.send('error: state does not match');
  }
  var authenticationContext = new AuthenticationContext(authorityUrl);
  authenticationContext.acquireTokenWithAuthorizationCode(req.query.code, redirectUri, resource, sampleParameters.clientId, sampleParameters.clientSecret, function(err, response) {
    if(err){
	console.log(error);
	return;
    }
	//token = response.accessToken;
	token = response.accessToken;
	res.send(token);
	//res.redirect('./one/:');
  });
});

app.get('/one/:id',function(req,res,next){
	var id = req.params.id;
	console.log(token);
	rest.get('https://graph.windows.net/myorganization/users/'+id+'?api-version=1.6',{accessToken:token}).on('complete',function(result){
		res.send(result);
	});
});
app.listen(process.env.PORT);
console.log('listening on 3001');
