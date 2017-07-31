Que = require '../'

Que.connect ['gearman://127.0.0.1:4730/']

require 'should'

describe 'Que', ->
	describe 'Drivers', ->
		describe 'Gearman', ->
			it 'should process data', (done) ->
				class EchoReverseWorker extends Que.Model
					driver: 'gearman'
					job: 'echoReverse'
					
					process: (callback) ->
						callback false, echo: @params.message.split('').reverse().join('')
					
				EchoReverseWorker = Que.setup EchoReverseWorker
				
				EchoReverseWorker.submit message: '2pac', (err, response) ->
					response.echo.should.equal 'cap2'
					do done