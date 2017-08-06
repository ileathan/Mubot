url = require 'url'
Gearman = require 'node-gearman'
Client = undefined

class GearmanDriver
	@connect: (server, done) ->
		url = url.parse server
		Client = new Gearman url.hostname, url.port
		Client.on 'connect', -> done()
		Client.connect()
	
	@disconnect: (done) ->
		Client.disconnect()
		done()
	
	@register: (name, handler) ->
		Client.registerWorker name, (payload, worker) ->
			handler payload.toString('utf-8'), worker
	
	@submit: (name, params) ->
		Client.submitJob name, params

module.exports = GearmanDriver