var express = require('express');
var path = require('path');
var fs = require('fs');
var readline = require('readline');

function CSVToArray(strData, strDelimiter) {
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = (strDelimiter || ',');
  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp((
    // Delimiters.
  '(\\' + strDelimiter + '|\\r?\\n|\\r|^)' +
  // Quoted fields.
  '(?:"([^"]*(?:""[^"]*)*)"|' +
  // Standard fields.
  '([^"\\' + strDelimiter + '\\r\\n]*))'), 'gi');
  // Create an array to hold our data. Give the array
  // a default empty first row.
  var arrData = [[]];
  // Create an array to hold our individual pattern
  // matching groups.
  var arrMatches = null;
  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while (arrMatches = objPattern.exec(strData)) {
    // Get the delimiter that was found.
    var strMatchedDelimiter = arrMatches[1];
    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
      // Since we have reached a new row of data,
      // add an empty row to our data array.
      arrData.push([]);
    }
    // Now that we have our delimiter out of the way,
    // let's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[2]) {
      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      var strMatchedValue = arrMatches[2].replace(
        new RegExp('""', 'g'), '"');
    } else {
      // We found a non-quoted value.
      var strMatchedValue = arrMatches[3];
    }
    // Now that we have our value string, let's add
    // it to the data array.
    arrData[arrData.length - 1].push(strMatchedValue);
  }
  // Return the parsed data.
  return (arrData);
}

function CSV2JSON(csv) {
  var array = CSVToArray(csv);
  var objArray = [];
  for (var i = 1;i < array.length;i++) {
    objArray[i - 1] = {};
    for (var k = 0;k < array[0].length && k < array[i].length;k++) {
      var key = array[0][k];
      objArray[i - 1][key] = array[i][k];
    }
  }
  var json = JSON.stringify(objArray);

  return json.replace(/},/g, '},\r\n');
}

function tryParseJson(str) {
  try {
    return JSON.parse(str);
  } catch (ex) {

    return null;
  }
}

function loopForEachValue(obj, mapFunc) {  //funct has 2 args.. key,value
  var keys = obj ? Object.keys(obj) : [];
  keys.forEach(function(key) {
    var value = obj[key];
    mapFunc(key, value);
  });
}

function guessMetaData(record) {
  var result = {};
  loopForEachValue(record, function(key, value) {
    var keyField = key;
    var stringValue = String(value);
    var metaData = {
      key: key,
      label: key,
      example: value,
      pluck: function(item) {
        return item[keyField];
      },
      jsonType: typeof value,
      isPrivate: false,
      isNumber: !isNaN(value),
      isUrl: stringValue.startsWith('http') || stringValue.startsWith('www.'),
      isResource: stringValue.endsWith('.jpg') || stringValue.endsWith('.png')
    };

    function computeDataType(item) {
      if (item.isUrl) {
        return 'url';
      }
      if (item.isResource) {
        return 'resource';
      }

      if (item.isNumber) {
        return 'number';
      }
      return 'text';
    }

    metaData.dataType = computeDataType(metaData);
    result[key] = metaData;
  });
  return result;
}

module.exports = function(app) {
  var router = express.Router();

  var metadataResult = {};

  function getResult(key) {
    return metadataResult[key];
  }

  function putResult(key, data) {
    var metadata = JSON.stringify(data, undefined, 3);
    metadataResult[key] = metadata;
    return metadata;
  }

  function readFile(fileLocation, callback, onError) {
    var options = {
      encoding: 'utf8',
      flag: 'r'
    };

    fs.readFile(fileLocation, options, function(err, data) {
      if (err) {
        onError && onError(err.message);
      }

      var meta = {};
      if (fileLocation.endsWith('.csv')) {
        var result = CSV2JSON(data);
        var asJson = tryParseJson(result);
        var record = asJson[0];
        meta = guessMetaData(record);
      }
      else if (fileLocation.endsWith('.json')) {
        var asJson = tryParseJson(data);
        var record = asJson[0];
        meta = guessMetaData(record);
      }


      callback && callback(meta);
    });
  }

  /* GET the default filename */
  router.get('/', function(req, res, next) {

    if ( app.datalift.hasMetaData ) {
      var filename = app.contents.metadata;
      sendFile(filename, res);
      return;
    } 

    var filename = app.datalift.sourceFile;

    var result = getResult(filename);
    if (result) {
      res.end(result);
      return;
    }

    var fileLocation = path.join(app.dataLocation, filename);

    readFile(fileLocation, function(meta) {
      var result = putResult(filename, meta);
      res.end(result);
    }, function(error){
        res.end(error);
    });
  });


  return router;
};
