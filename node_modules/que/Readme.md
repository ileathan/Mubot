# Que

One interface to many queue & worker backends.

# Installation

```npm install que```

# Supported backends

- Gearman (via [node-gearman](http://search.npmjs.org/#/node-gearman))

# Usage

## Connecting

```javascript
var Que = require('que');

Que.connect(['gearman://127.0.0.1:4730'], function(){
	// all backends connected
});

Que.disconnect(function(){
	// all backends disconnected
});
```

## Defining worker

```javascript
var EchoReverseWorker = Que.define({
	job: 'echoReverse', // job name
	driver: 'gearman', // driver's name
	process: function(callback) { // processing function
		var result = this.params.message.split('').reverse().join(''); // this.params contains all the data you send, let's just reverse the string
		callback(false, { echo: result }); // first argument specifies error(none, in our case), second - response
	}
});
```

## Submitting jobs

```javascript
EchoReverseWorker.submit({ message: '2pac' }, function(err, response){ // second argument is optional
	response.echo == 'cap2'; // true
});
```

## For CoffeeScript developers

You can define workers using CoffeeScript native class system:

```coffee-script
class EchoReverseWorker extends Que.Model
	job: 'echoReverse'
	driver: 'gearman'
	
	process: (callback) ->
		result = @params.message.split('').reverse().join('')
		callback false, echo: result

EchoReverseWorker = Que.setup EchoReverseWorker # this is required, notice **Models** here, not just **Model**
```

### Making own drivers

Your driver should implement this interface:

```coffee-script
class SomeDriver
	@connect: (server, callback) ->
		# server is an URI, like protocol://127.0.0.1:1234
		# callback should be called when you connect to a backend
	
	@disconnect: (callback) ->
		# callback should be called when you disconnect from a backend
	
	@register: (name, handler) ->
		# name is the name of the job
		# handler is the function which handles the job
	
	@submit: (name, params) ->
		# name is the name of the job
		# params is the data that should be sent
```

After that, you should register your driver under chosen name:

```coffee-script
Que.registerDriver 'someDriver', SomeDriver
```

Users of your driver will be able to connect to it using URL like **someDriver://localhost:port/**.

# Tests

Run all the needed backends and execute `mocha` in Terminal.

# License

MIT.