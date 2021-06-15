const config = require('./config').config;
const get = require('simple-get')


/**
 * Given an array of webhooks and an array of data,
 * create a call to each webhook for each datum,
 * injecting data into the webhook.url and webhook.body using
 * the {{notation}}
 * @param {*} webhooks 
 * @param {*} data 
 */
function format(webhooks, data) {
    const formatted = [];

    webhooks.forEach(webhook => {

        data.forEach(datum => {
            let url = webhook.uri;
            let body = webhook.body;
    
            Object.keys(datum).forEach(key => {
                url = injectData(url, key, datum[key]);
                body = injectData(body, key, datum[key]);
            });
    
            formatted.push({
                url,
                body,
                method: webhook.method
            });
        })
        
    });

    return formatted;
}

/**
 * Does the given data pass the given filter?
 * @param {*} data 
 * @param {*} filter 
 */
function passesFilter(data, filter) {
    const keys = Object.keys(filter);
    for(let i in keys) {
        const key = keys[i];
        const regTest = new RegExp(filter[key]);
        if(!regTest.test(data[key])) return false;
    }
    return true;
}

/**
 * Checks all data against all filters and returns any data that matches any filter
 * @param {*} data 
 * @param {*} filters 
 */
function anyDataPassingFilters(data, filters) {
    const passedData = [];
    for(let i in filters) {
        const filter = filters[i];
        for(let j in data) {
            const currData = data[j];
            if(passesFilter(currData, filter)) passedData.push(currData);
        }
    }
    return passedData;
}

/**
 * String-replace '{{dataName}}' with the replacement in source
 * @param {string} source 
 * @param {string} dataName 
 * @param {string} replacement 
 */
function injectData(source, dataName, replacement) {
    return source.replace(`{{${dataName}}}`, replacement);
}

/**
 * GET request
 * @param {*} endpoint 
 * @param function cb (err, data) - data is JSON.parse'd 
 */
function fetchData(endpoint, cb) {
    get.concat(endpoint, function (err, res, data) {
      if (err) return cb(err);
      return cb(null, JSON.parse(data));
    })
}

/**
 * Add JSONified 'content', flightaware link, title and apikey for injecting into urls with the {{notation}}
 * @param {*} data 
 */
function addMetadata(data) {
    data.forEach(datum => {
        datum.content = JSON.stringify(datum);

        if(apiKey !== undefined) datum.key = apiKey;
        if(datum.flight) datum.flightaware = "https://uk.flightaware.com/live/flight/" + datum.flight;

        datum.title = "Aircraft found";
    });
    return data;
}

/**
 * Fetch data from dump1090, check if it passes filters and trigger webhook if req
 * @param {string} apiKey 
 */
function webhookTick(apiKey) {
    fetchData(config.dump1090Uri, (err, data) => {
        if(err) return console.error(err);
        const matches = anyDataPassingFilters(data, config.filters);
        if(matches.length == 0) return console.log("No filter matches");

        console.log(`${matches.length} matches!`);

        console.log(Object.keys(matches[0]));
        let modData = addMetadata(matches);

        let requiredCalls = format(config.webhooks, modData);
        console.log(JSON.stringify(requiredCalls));
        requiredCalls.forEach(call => {
            if(call.method == "GET")  {
                fetchData(call.url, (err, data) => {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log("Push res: " + JSON.stringify(data));
                    }
                });
            } else {
                console.error(call.url + " not supported - " + call.method);
            }
        })
    })
}

let apiKey = undefined;
if(process.argv.length > 2) apiKey = process.argv[2];

console.log("Started");
webhookTick(apiKey);
setInterval(webhookTick.bind(this, apiKey), config.pollTimeSeconds * 1000);
