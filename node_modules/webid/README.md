# node-webid

[![Build Status](https://travis-ci.org/linkeddata/node-webid.svg?branch=master)](https://travis-ci.org/linkeddata/node-webid)
[![NPM Version](https://img.shields.io/npm/v/webid.svg?style=flat)](https://npm.im/webid)
[![Gitter chat](https://img.shields.io/badge/gitter-join%20chat%20%E2%86%92-brightgreen.svg?style=flat)](http://gitter.im/linkeddata/node-webid)

Node.js module with tools to help using [WebID](http://linkeddata.github.io/SoLiD/#identity-management-based-on-webid).

## Installation

```
$ npm install webid --save
```

## Features

- [x] Retrieve a WebID
- [x] Verify a WebID+TLS
- [x] Generate a WebID+TLS

## Usage

To verify a WebID / certificate:

```javascript
// Self-signed certificate parsed by Express
var validCert = {
  subject: { O: 'WebID', CN: 'Nicola Greco (test) [on test_nicola.databox.me]' },
  issuer: { O: 'WebID', CN: 'Nicola Greco (test) [on test_nicola.databox.me]' },
  subjectaltname: 'URI:https://test_nicola.databox.me/profile/card#me',
  modulus: 'C62AE4CE77A8D915527F79EE1B5365099A35A3BF8E4AA68ED7CBF4D6B966ACE0FCAD79DE66A0EA89FF5EF8DAB2619F51E2F28227C9AA594BA3A4176723BA00813D8F8C738359F6240DF8FADD1A7AE56F2B24E7329A189E1065E3E7C2CEC96CC57CD9D3BF782DC15C11FBEFD24E536C46E8E1285BEC27CB3CC6C295595F18BC564A6ACA45ABCB8AD0C6617F42F5151DDB1A42513BE7AA9E2593DFDBB03938C15136C202C61E59DFE7C563F56301B5B29F91C03A9C92458BA26918E22CB137B998FF76EC85E97D16424078A949F491E348D9E33A43C9D5D938C6E12B2F2015FA2C1A950E28C6ECC6DD70CE228275DBB4C085BC4063DA24178F5B13601E3E6CE17F',
  exponent: '10001',
  valid_from: 'Jan  1 00:00:00 2000 GMT',
  valid_to: 'Dec 31 23:59:59 2049 GMT',
  fingerprint: '17:09:CB:F5:8D:D7:49:BB:36:45:B8:96:01:C9:0F:0D:E7:56:5B:C0',
  serialNumber: '2A'
}

// Using the TLS webid strategy
var webid = require('webid')('tls')

var agentWebId = 'https://corysabol.databox.me/profile/card#me'
webid.verify(validCert, callback)
```

To generate a WebID / certificate.

```javascript
var forge = require('node-forge')
var asn1 = forge.asn1
var pki = forge.pki

var webid = require('webid')('tls')

// Sample Express handler for the account /register endpoint
// This is what a form containing a `<keygen>` element will POST to
app.post('/register', bodyParser(), function (req, res) {
  var options = {
    // <keygen name=spkack>
    spkac: new Buffer(req.body.spkac),
    agent: req.session.userWebId
  }
  webid.generate(options, function(err, cert) {
    // Some browsers only accept DER formatted certificates
    var der = asn1.toDer(pki.certificateToAsn1(cert)).getBytes()
    // Send back the generated certificate with a WebID URI in the subjectAltName
    res.set('Content-Type', 'application/x-x509-user-cert')
    res.send(new Buffer(der, 'binary'))
  })
})
```

### Options

```javascript
var options = {
  // <keygen name=spkack>
  spkac: new Buffer(req.body.spkac),
  agent: req.session.userWebId,
  commonName: '',
  organizationName: '',
  issuer: {
    commonName: '',
    organizationName: ''
  }
}
```

## History

Originally forked from [magnetik/node-webid](https://github.com/magnetik/node-webid)

## License

MIT
