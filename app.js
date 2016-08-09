var express = require('express');
var cors = require('cors')
var fs = require('fs');
var path = require('path');
var http = require('http');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var async = require('async');
var dbAPI = require("./model/rethinkAPI");
var glob = require("glob");

var app = express();
app.use(cors());

app.dataLocation = path.join(__dirname, 'data');
app.serviceLocation = path.join(__dirname, 'API');
app.datalift = {
  configError: '',
  sourceFile: 'unknown',
  payloadFile: 'unknown'
};

function mixin(target, source) {
  if (!source) return target;
  if (!target) return source;
  for (var name in source) {
      target[name] = source[name];
  }
  return target;
};


app.viewModel = function(model) {
    var result = {
      heading: 'Datalift',
      title: '',
      payload: ''
    }; 

    mixin(result, model);
    mixin(result, {
      manifest: app.datalift,
      sourceFile: app.datalift.sourceFile,
      payloadFile: app.datalift.payloadFile,
    });

    return result;
}
app.getView = function(defaultView){
  var view = app.datalift.configError ? 'badConfig': defaultView;
  return view;
}

// Development Only
if (app.get('env') === 'development') {
  var sassMiddleware = require('node-sass-middleware');

  // Note: you must place sass-middleware *before* `express.static`
  app.use(sassMiddleware({
    /* Options */
    src: __dirname + '/stylesheets',
    dest: path.join(__dirname, 'public/stylesheets/'),
    debug: true,
    outputStyle: 'compressed',
    prefix: '/stylesheets/'  // Where prefix is at <link rel="stylesheets" href="prefix/style.css"/>
  }));
}

//these are the views and view controllers
var index = require('./routes/index')(app);
var sampleData = require('./routes/sampleData')(app);
var metaData = require('./routes/metaData')(app);
var rawData = require('./routes/rawData')(app);
var info = require('./routes/info')(app);
var provenance = require('./routes/provenance')(app);
var developers = require('./routes/developers')(app);
var data = require('./routes/data')(app);

var dataAPI = require('./routes/API/data')(app);
var infoAPI = require('./routes/API/info')(app);
var provenanceAPI = require('./routes/API/provenance')(app);
var developersAPI = require('./routes/API/developers')(app);
var metaDataAPI = require('./routes/API/metaData')(app);
var rawDataAPI = require('./routes/API/rawData')(app);
var sampleDataAPI = require('./routes/API/sampleData')(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

// Frontend routes
app.use('/resources', express.static(path.join(__dirname, 'node_modules')));
app.use('/', index);
app.use('/sampleData', sampleData);
app.use('/metaData', metaData);
app.use('/rawData', rawData);
app.use('/data', data);
app.use('/info', info);
app.use('/developers', developers);
app.use('/provenance', provenance);

// API routes
app.use('/API/metaData', metaDataAPI);
app.use('/API/sampleData', sampleDataAPI);
app.use('/API/rawData', rawDataAPI);
app.use('/API/data', dataAPI);
app.use('/API/info', infoAPI);
app.use('/API/provenance', provenanceAPI);
app.use('/API/developers', developersAPI);






// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


//this needs to be a blocking call because the app
//cannot continue unless the config is read..
function readDataLiftConfig(callback) {
  var options = {
    encoding: 'utf8',
    flag: 'r'
  };

  var configFile =  'datalift.json';
  try {
    var fileLocation =  path.join(app.dataLocation, 'datalift.json');
    var data = fs.readFileSync(fileLocation, options);

    var json = JSON.parse(data);
    callback && callback(json);  
  } 
  catch(err) {
    console.log(err.message);
    mixin(app.datalift, {
      sourceFile: 'missing:' + configFile,
      configError: err.message
    });
  }

}

//load configuration manifest
readDataLiftConfig(function(data){
    app.contents = data.contents;
    app.datalift = mixin(data, {
      hasPreview: data.contents.preview ? true : false,
      hasPayload: data.contents.payload ? true : false,
      hasRaw: data.contents.raw ? true : false,
      hasMetaData: data.contents.metadata ? true : false,
      hasProvenance: data.contents.provenance ? true : false,
      hasInfo: data.contents.info ? true : false,
      sourceFile:  data.contents.raw || data.contents.payload || data.contents.preview,
      payloadFile:  data.contents.payload || data.contents.raw || data.contents.preview,
      hasDevelopers: true
   });

   //add the code to create dbServer and init DB
   dbAPI.initDBEngine(app,function() {
     dbAPI.initDB(app,app.datalift, function(err,connect){
       app.dbConnect = connect;
       console.log('database connected');

       setTimeout(function() {
          if ( app.datalift.hasInfo ){
              dbAPI.fillTableFromService(app, {table: 'info', url: '/API/info'});
          }
          if ( app.datalift.hasProvenance ){
              dbAPI.fillTableFromService(app, {table: 'provenance', url: '/API/provenance'});
          }
          if ( app.datalift.hasPayload ){
              dbAPI.fillTableFromService(app, {table: 'data', url: '/API/data'});
          } 

       }, 2000);


     })
   });
  
});

module.exports = app;
