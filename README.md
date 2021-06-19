# dump1090-monitor
Monitor a dump1090 json feed and call webhooks based on the content, eg for push notifications to mobile.

The program is generic enough that it could probably be modified quite easily for any query->filter->webhook workflow.


## Install

You'll need `npm` and `node` installed. For a Raspberry Pi, there's a good tutorial [on makersupplies](https://www.makersupplies.sg/blogs/tutorials/how-to-install-node-js-and-npm-on-the-raspberry-pi) which should get you there.

You will also need `git`, which is probably installed already. You can run `git --version` on the pi, and if you get something like `git version 2.11.0` then you're all good. Otherwise just run:

```bash
sudo apt update
sudo apt install git
```

Finally, you should be ready to install `dump1090-monitor`. Just run these commands in order:

```bash
cd /home/pi/Documents
git clone https://github.com/Slord6/dump1090-monitor.git
cd dump1090-monitor/
npm i
```

Now you can run it (but may want to sort your config first - see below).

### Run

Invoke node on index.js, optionally passing an apiKey

```bash
node .\index.js <apiKey>
```

#### Run on startup

There are a few ways to do this - I just use `rc.local`. Open the file to edit:

```bash
sudo nano /etc/rc.local
```

Then, prior to `exit 0` (and after dump1090's startup if that is done here), at the bottom add:

`node /home/pi/Documents/dump1090-monitor/index.js <optional api key> &`

The `&` is important; it allows the `rc.local` script to continue whilst dump1090-monitor runs separately.

## Config

All configuration can be done in `config.js`, an example config is below, assuming use of [Push notification API](https://play.google.com/store/apps/details?id=net.xdroid.pn&hl=en_GB&gl=US) app and [Pushover](https://pushover.net/)

```JavaScript
const config = {
    // The url of the dump1090 instance
    dump1090Uri: 'http://zerohero.broadband:8080/dump1090/data.json',
    // How often to query dump1090 for new data
    pollTimeSeconds: 30,
    // Webhooks to be called when any flight data matches a filter
    // Each webhook is called once for each matching datum
    webhooks: [
        // Example for Push notification API
        {
            uri: 'http://xdroid.net/api/message?k={{key}}&t={{title}}&u={{flightaware}}&c={{content}}',
            method: 'GET',
            body: ''
        },
        // Example for Pushover
        {
            uri: 'https://api.pushover.net/1/messages.json',
            method: 'POST',
            body: 'token={{key}}&user=<add user key here>&title={{title}}&message={{content}}'
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

Any changes to the config will require restarting the program.

If there is a service you want added to the default config, just [open an issue](https://github.com/Slord6/dump1090-monitor/issues/new/choose).

## Data injection

The webhook URLs (and for POST requests, body) can be injected with dynamic data for each call like so: 

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