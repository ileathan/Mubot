url = require 'url'
async = require 'async'

clone = (src)-> # function cloning
	dest = ->
	for property of src
		dest[property] = src[property] if src.hasOwnProperty property
	
	src:: = dest::
	src

class Que # namespace
	@drivers: {}
	
	@registerDriver: (name, driver) ->
		@drivers[name] = driver
	
	@connect: (servers = [], callback) ->
		async.forEach servers, (server, nextServer) =>
			driver = @drivers[url.parse(server).protocol.replace(':', '')]
			driver.connect server, -> do nextServer
		, ->
			do callback if callback
	
	@disconnect: (callback) ->
		async.forEach @drivers, (driver, nextDriver) ->
			driver.disconnect -> do nextDriver
		, ->
			do callback if callback
	
	@workers: {}

	@define: (params) -> # for non-coffee folks
		worker = clone Que.Model
		for param of params
			worker::[param] = params[param] if params.hasOwnProperty param

		@setup worker


	@setup: (worker) ->
		worker.job = worker::job
		worker.driver = Que.drivers[worker::driver]
		worker.driver.register worker::job, (params, job) -> # processor
			processor = new worker
			processor.params = JSON.parse params
			processor.process.call processor, (err, response) ->
				processor.response = response
				processor.finished.call processor err if processor.finished
				job.end JSON.stringify response

		@workers[worker::job] = worker
		worker

Que.registerDriver 'gearman', require('./drivers/gearman')

class Que.Model
	constructor: ->
	
	@submit: (params, callback) ->
		worker = @driver.submit @job, JSON.stringify(params)
		data = undefined
		worker.on 'data', (response) ->
			data = JSON.parse response.toString()
		
		worker.on 'end', ->
			callback false, data if callback

module.exports = Que		