const axios = require('axios');
const fs = require('fs');
const http = require('http');
const https = require('https');

// SPARQL query
const query = `
SELECT ?city ?cityLabel ?flag
WHERE 
{
  ?city wdt:P31/wdt:P279* wd:Q515;  # find instances of subclasses of city
        wdt:P30 wd:Q46;             # in Europe
        wdt:P41 ?flag.              # with a flag
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}`;

// URL of the Wikidata Query Service
const url = 'https://query.wikidata.org/sparql';

// Create the directory if it doesn't exist
const dir = './flags';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// Send a GET request to the Wikidata Query Service
axios.get(url, {
  params: {
    query: query,
    format: 'json'
  }
}).then(response => {
  // Loop through the results
  response.data.results.bindings.forEach((result, index) => {
    // Get the URL of the flag
    const flagUrl = result.flag.value;

    // Create a write stream for the image file
    const file = fs.createWriteStream(`${dir}/${index}.jpg`);

    // Download the image and save it
    const protocol = flagUrl.startsWith('https') ? https : http;
    protocol.get(flagUrl, response => {
      response.pipe(file);
    });
  });
}).catch(error => {
  console.error(error);
});