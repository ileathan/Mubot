// Description: 
//   Kill your mubot on command.
//
// Commands:
//   mubot die - kills your mubot
//
// Author:
//   leathan
//

(function() {
let bot = null
;
const l = {}
;
l.seen = {
  last: null
}
;
l.config = {
  enabled: false,
  filter_funcs: [ _=>1 ],
  time_till_throttle: 7777,
  max_req_till_throttle: 77,
  router: {
    enabled: false,
    re_routes: ["www"],
    dev_routes: ["dev"],
    dev_filepath: "leat-dev.html",
    insert_at: -2 // since the last 2 mubot middlewares are error handles.
  },
  cache_size: 1000
}
;
l.seen.save = () => {
  bot.brain.data.seen || (bot.brain.data.seen = {});

  for(let seen in l.seen) {
    if(seen === "last") {
      delete l.seen[seen].req;
      break;
    }
    Object.assign(bot.brain.data.seen, l.seen[seen])
  }
  bot.brain.save()
}
Object.defineProperty(l, 'exports', {
  enumerable: false,
  value: _bot => {
    bot = _bot;
    //l.stop();
    //l.router.stop();
    l.start();
    l.router.start();
    
    // Configure command.
    bot.respond(/firewall(?: )? ([{](?:.*))/i, l.start);

    bot.respond(/(?:set )?(firewall|router)(?: ([^{]+))?(?: (.+))?/i, l.configure);

    bot.respond(/firewall (on|start|1)/i, l.start);
    bot.respond(/firewall (off|stop|0)/i, l.stop);
    bot.respond(/firewall re(load|fresh)/i, l.router.stop && l.router.start);

    bot.respond(/router (on|start|1)/i, l.router.start);
    bot.respond(/router (off|stop|0)/i, l.router.stop);
    bot.respond(/router re(load|fresh)/i, ()=>l.router.stop && l.router.start);
    Object.assign(bot.mubot, {firewall: l})
  }
})
;
l.configure = (res = {send: _=>_}) => {
  let [, mode, key, prop] = res.match;

  let obj = /^router$/i.test(mode) ? l.config[key] : l.config.router[key];

  obj ?
    prop ?
      (()=> {
        try {
          obj[key] = JSON.parse(prop);
          res.send(`Set ${key} to ${prop}.`)
        } catch(e) {
          res.send("Error parsing JSON.")
        }
      })()
    :
      res.send(`${key} is ${obj[key]}.`)
    //
  :
    prop ?
      (()=> {
        try {
          let json = JSON.parse(prop)
          Object.assign(obj, json)
          res.send("Configuration set successfully.")
        } catch(e) {
          try {
            // Attempt to fix the json.
            let rjson = require('relaxed-json');
            prop = rjson.parse(prop);
            Object.assign(obj, prop);
          } catch(e) {
            res.send("Error parsing JSON.")
          }
        }
      })()
    :
      res.send(
        `Firewall is ${l.config.router.enabled?"running":"not running"}.` +
        ` Router is ${l.config.router.enabled?"running":"not running"}.`
      )
    //
  ;
}
;
l.stop = (res = {send: _=>_}) => {
  return res.send(l.utils.removeLayer(`${bot.name}_firewall`));
}
;
l.start = (res = {send: _=>_}) => {
  if(l.config.enabled)
    return "Already enabled"
  ;
  l.config.enabled = true;
  let new_layer = l.utils.createLayer();
  new_layer.name = `${bot.name}_firewall`;
  new_layer.handle = (req, res, next)=> {
//debugger;
    let ip = req.connection.remoteAddress.split(':').pop();
    if(l.seen[ip]) {
      let o = l.seen[ip];
      ++o.times;
      ++o.all_times;
      o.last = new Date();
      o.reqs.length > l.config.cache_size && o.shift();
      o.reqs.push(req);
    } else {
      l.seen[ip] = {
        times: 1,
        all_times: 1,
        last: Date.now(),
        reqs: [req],
        throttled: []
      };
    }
    if(Date.now() - l.seen[ip].last < l.config.time_till_throttle
    && l.seen[ip].times > l.config.max_req_till_throttle) {
      return res.end("Throttled");
      l.seen[ip].throttled.push(new Date().toLocaleString())
    } else {
      l.seen[ip].times = 0;
    }
    l.seen.last = {req, ip, time: Date.now()};
    next();
  }
  ;
  l.utils.addLayer(new_layer, 0)
  let r = "Firewall enabled.";
  res.send(r)
  return r;
}
;
l.utils = {}
;
l.utils.removeLayer = name => {
  let layers = bot.router._router.stack;
  for(let i = 0, len = layers.length; i < len; ++i) {
    let layer = layers[i];
    if(layer.name === `${bot.name}_${name}`) {
       layers.splice(i, 1);
       return "Layer removed.";
    }
  }
  return 'Layer not found.';
}
;
l.utils.createLayer = (opts = {}) => {
  let layer = bot.router._router.stack[0];
  if(typeof opts === "string") {
    opts = {name: opts};
  }
  return Object.assign(Object.create(layer), layer, opts);
}
;
l.utils.addLayer = (layer, index) => {
  let insert_at = index != null ? index : l.config.router.insert_at,
      layers = bot.router._router.stack
  ;
  layers.splice(insert_at, 0, layer);
  return index ?
    "Inserted layer at " + index + "."
  :
    "No index specified, removed last safe layer (" + insert_at + ".)"
  ;
}
;
l.router = {}
;
l.router.stop = () => {
  return l.utils.removeLayer(`${bot.name}_router`);
}
;
l.router.start = () => {
  let new_layer = l.utils.createLayer(),
      cnfg = l.config.router,
      insert_at = cnfg.insert_at,
      reBoth = RegExp(`^(${cnfg.dev_routes.concat(cnfg.re_routes).join('|')})\.`, 'i'),
      reDev = RegExp(`^(${cnfg.dev_routes.join('|')})\.`, 'i'),
      reRoutes = RegExp(`^(${cnfg.re_routes.join('|')})\.`, 'i'),
      devFilename = cnfg.dev_filename
  ;
  new_layer.name = `${bot.name}_router`;
  new_layer.handle = (req, res, next)=> {
    !
      reBoth.test(req.headers.host) ?
        next()
    :
      reDev.test(req.headers.host) ?
        res.sendFile(path + "leat-dev.html")
      :
        (()=> {
          let href, host = req.headers.host;
          host = host.replace(reRoutes, '');
          href = 'https://' + host + req.url;
          res.statusCode = 301;
          res.setHeader('Location', href);
          res.write('Redirecting to ' + host + req.url + '');
          res.end();
        })()
      //
    ;
  }
  ;
  return l.utils.addLayer(new_layer, insert_at)
  ;
}
;
l.help = res => {
  res || (res = {send: _=>_});
  let r = "This module allows throttling and sanitizing server requests. "
          + "Possible commands are `Mubot router/firewall on/off`"
          + "To set up custom configurations use `Mubot firewall {options}`."
          + "Possible options are `" + JSON.stringify(l.config) + "`."
  ;
  return res.send(r);
}
;

module.exports = l.exports;

// End module.
}).call(this);