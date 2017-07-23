module.exports = get

var request = require('request')
var url = require('url')

function get (webid, callback) {
  var uri = url.parse(webid)
  var options = {
    url: uri,
    method: 'GET',
    headers: {
      'Accept': 'text/turtle, application/ld+json'
    }
  }

  request(options, function (err, res, body) {
    if (err) {
      return callback(new Error('Failed to fetch profile from ' + uri.href + ': ' + err))
    }

    if (res.statusCode !== 200) {
      return callback(new Error('Failed to retrieve WebID from ' + uri.href + ': HTTP ' + res.statusCode))
    }

    callback(null, body, res.headers['content-type'])
  })
}
