const config = {
    // The url of the dump1090 instance
    dump1090Uri: 'http://zerohero.broadband:8080/dump1090/data.json',
    // How often to query dump1090 for new data
    pollTimeSeconds: 30,
    // Webhooks to be called when any flight data matches a filter
    // Each webhook is called once for each matching datum
    webhooks: [
        // Example for https://play.google.com/store/apps/details?id=net.xdroid.pn&hl=en_GB&gl=US
        {
            uri: 'http://xdroid.net/api/message?k={{key}}&t={{title}}&u={{flightaware}}&c={{content}}',
            method: 'GET',
            body: ''
        },
        // Example for https://pushover.net/
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