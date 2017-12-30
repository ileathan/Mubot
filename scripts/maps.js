// Description:
//   Interacts with the Google Maps API.
//
// Commands:
//   imubot [satellite|terrain|hybrid] map me <query> - Returns a map view of the area returned by `query`.


// Generated by CoffeeScript 1.12.6
(function() {
  module.exports = function(bot) {
    bot.respond(/((driving|walking|bike|biking|bicycling) )?directions from (.+) to (.+)/i, function(msg) {
      var destination, key, mode, origin, query, url;
      mode = msg.match[2] || 'driving';
      origin = msg.match[3];
      destination = msg.match[4];
      key = process.env.MUBOT_GOOGLE_API_KEY;
      if (origin === destination) {
        return msg.send("Now you're just being silly.");
      }
      if (!key) {
        msg.send("Please enter your Google API key in the environment variable MUBOT_GOOGLE_API_KEY.");
      }
      if (mode === 'bike' || mode === 'biking') {
        mode = 'bicycling';
      }
      url = "https://maps.googleapis.com/maps/api/directions/json";
      query = {
        mode: mode,
        key: key,
        origin: origin,
        destination: destination,
        sensor: false
      };
      return bot.http(url).query(query).get()(function(err, res, body) {
        var distance, duration, end, i, instructions, j, jsonBody, legs, len, ref, response, route, start, step;
        jsonBody = JSON.parse(body);
        route = jsonBody.routes[0];
        if (!route) {
          msg.send("Error: No route found.");
          return;
        }
        legs = route.legs[0];
        start = legs.start_address;
        end = legs.end_address;
        distance = legs.distance.text;
        duration = legs.duration.text;
        response = "Directions from " + start + " to " + end + "\n";
        response += distance + " - " + duration + "\n\n";
        i = 1;
        ref = legs.steps;
        for (j = 0, len = ref.length; j < len; j++) {
          step = ref[j];
          instructions = step.html_instructions.replace(/<div[^>]+>/g, ' - ');
          instructions = instructions.replace(/<[^>]+>/g, '');
          response += i + ". " + instructions + " (" + step.distance.text + ")\n";
          i++;
        }
        msg.send("http://maps.googleapis.com/maps/api/staticmap?size=400x400&" + ("path=weight:3%7Ccolor:red%7Cenc:" + route.overview_polyline.points + "&sensor=false"));
        return msg.send(response);
      });
    });
    return bot.respond(/(?:(satellite|terrain|hybrid)[- ])?map( me)? (.+)/i, function(msg) {
      var location, mapType, mapUrl, url;
      mapType = msg.match[1] || "roadmap";
      location = encodeURIComponent(msg.match[3]);
      mapUrl = "http://maps.google.com/maps/api/staticmap?markers=" + location + "&size=400x400&maptype=" + mapType + "&sensor=false" + "&format=png";
      url = "http://maps.google.com/maps?q=" + location + "&hl=en&sll=37.0625,-95.677068&sspn=73.579623,100.371094&vpsrc=0&hnear=" + location + "&t=m&z=11";
      msg.send(mapUrl);
      return msg.send(url);
    });
  };

}).call(this);
