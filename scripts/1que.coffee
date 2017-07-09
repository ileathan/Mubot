# Description:
#   Allows sending messages over the max length for discord
#

POWER_COMMANDS = [ 'create.file', 'view.file' ]
POWER_USERS = [ 'leathan' ]

module.exports = (robot) ->

  # Check if the command is secured, and if user is allowed
  # #
  robot.listenerMiddleware (context, next, done) ->
    if context.listener.options.id in POWER_COMMANDS
      if context.response.message.user.name in POWER_USERS
        do next
      else
        context.response.send "I'm sorry, @#{context.response.message.user.name}, but you don't have access to do that."
        #return
        do done
    else
      do next

  #
  # Keep pushing messages over 2000 into the context.strings que
  # # #
  robot.responseMiddleware (context, next, done) ->
    return unless context.plaintext?
    i = 0
    RecursAndQue = () ->
      if context.strings[i]? and context.strings[i].length > 2000
        fpad = ""; epad = ""
        if context.response.match[0].indexOf('view') == 0
          fpad = '```coffeescript\n'; epad = '```'
        if context.response.match[0].indexOf('search') == 0
          fpad = '```\n'; epad = '```'
        m = context.strings[i].match(/^([\s\S]{0,1940}\n)/)
        if not m?[0] then m = context.strings[i].match(/^([\s\S]{0,1940})/)
        context.strings.push "#{fpad}" + context.strings[i].slice(m[1].length)
        context.strings[i] = context.strings[i].slice(0, m[1].length) + epad
        i++
        do RecursAndQue
    RecursAndQue context.strings[i]
    do done









# before i realised strings.context is the que
#  LEGACY HACK
#    counter = 0
#    Send = (data) ->
#      if data.length > 2000
#        context.strings = [""]
#        m = data.match(/^((?:.|\s){0,1920}\n)/)
#        extraData = "#{fpad}" + data.slice(m[1].length)
#        data = [data.slice(0, m[1].length)]
#        setTimeout () ->
#          context.response.robot.messageRoom context.response.message.room, data.slice(0, m[1].length) + epad
#        , counter
#        counter += 200
#        if extraData.length > 2000
#          Send extraData
#        else    
#          setTimeout () ->
#            context.response.robot.messageRoom context.response.message.room, extraData
#          , counter
#      else
#        # Do nothing, context.strings's length is small enough to fix in one message. 
#    Send context.strings.toString()
    next()
