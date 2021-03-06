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
	res.send(html);
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
	token = response.accessToken;
	res.redirect('/app'); 
 });
});

app.get('/one/:id',function(req,res,next){
	var id = req.params.id;
	console.log(token);
	rest.get('https://graph.windows.net/myorganization/users/'+id+'?api-version=1.6',{accessToken:token}).on('complete',function(result){
		res.send(result);
	});
});
app.listen(process.env.PORT || 3001);
console.log('listening on 3001');

var html = '<!DOCTYPE html><html><head><script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script></head><body><form>Enter Username:<br><input type="text" name="userid" id="uid"><br> </form><button type="button" id="sub-btn">Submit</button><div id="result"></div><script>$("#sub-btn").click(function(){var id = $("#uid").val();$.get("http://rajgraphapi.azurewebsites.net/one/"+id, function(result){$("#result").html(JSON.stringify(result));});});</script></body></html>';