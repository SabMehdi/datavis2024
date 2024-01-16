const axios = require('axios');
const fs = require('fs');

async function saveImagesFromSparqlQuery() {
    try {
        // Make the SPARQL query
        const sparqlQuery = `
        SELECT ?dog_breed ?dog_breedLabel (SAMPLE(?image) AS ?image)
        WHERE
        {
          ?dog_breed wdt:P31 wd:Q39367; # Instance of dog breed
                     wdt:P18 ?image.    # Property for image
          SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        GROUP BY ?dog_breed ?dog_breedLabel
      
        `;
        const dir = './dogs';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        const response = await axios.get('https://query.wikidata.org/sparql', {
            params: {
                query: sparqlQuery,
                format: 'json',
            },
        });

        // Save the images asynchronously
        const savePromises = response.data.results.bindings.map(async binding => {
            const imageUrl = binding.image.value;
            const dogBreedLabel = binding.dog_breedLabel.value;
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(imageResponse.data, 'binary');
            const filename = `${dogBreedLabel}.jpg`;
            fs.writeFileSync(`dogs/${filename}`, imageBuffer);
            console.log(`Saved ${filename}`);
        });
        await Promise.all(savePromises);
        console.log('All images saved successfully!');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

saveImagesFromSparqlQuery();
