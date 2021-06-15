# dump1090-monitor
Monitor a dump1090 json feed and call webhooks based on the content, eg for push notifications to mobile.

The program is generic enough that it could probably be modified quite easily for any query->filter->webhook workflow.


## Install

```cmd
git clone <this>
npm i
```

### Run

Invoke node on index.js, optionally passing an apiKey

`node .\index.js <apiKey>`


## Config

All configuration can be done in `config.js`, an example config is below, assuming use of [Push notification API](https://play.google.com/store/apps/details?id=net.xdroid.pn&hl=en_GB&gl=US) app.

```JavaScript
const config = {
    // The url of the dump1090 instance
    dump1090Uri: 'http://zerohero.broadband:8080/dump1090/data.json',
    // How often to query dump1090 for new data
    pollTimeSeconds: 30,
    // Webhooks to be called when any flight data matches a filter
    // Each webhook is called once for each matching datum
    webhooks: [
        {
            uri: 'http://xdroid.net/api/message?k={{key}}&t={{title}}&u={{flightaware}}&c={{content}}',
            method: 'GET',
            body: ''
        }
    ],
    // Array of filters, if a datum passes any filter, webhooks are invoked for
    // that datum. Filters can be set on any key returned by the dump1090 json:
    // hex, squawk, flight, lat, lon, validPosition, altitude, vert_rate, track,
    // validtrack, speed and messages
    filters: [
        {
            altitude: "\w{5,100}" // Matches any altitude with between 5 and 100 digits (alt) > 9999)
        }
    ]
}

exports.config = config;
```


## Data injection

The webhook URLs can be injected with dynamic data for each call like so: 

`http://example.com?key={{apiKey}}`

where `{{apiKey}}` can be a number of variables:

Any of the flight data:

`hex, squawk, flight, lat, lon, validPosition, altitude, vert_rate, track, validtrack, speed, messages`

Or there are some additional custom injections:

`flightaware` - link to `https://uk.flightaware.com/live/flight/<flight>`

`title` - the string `"Aircraft found"`

`content` - the result of `JSON.stringify` called on the flight data

`apiKey` - the key passed on the command line (see 'Run' above)

### Add or modify custom injection data

The custom data is all added in the function `addMetadata` in `index.js`.