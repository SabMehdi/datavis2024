const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp')

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

;

async function createMosaic(images, mosaicWidth, mosaicHeight) {
  // Load all images
  const loadedImages = await Promise.all(images.map(image => Jimp.read(image)));

  // Create a new image with the size of the mosaic
  const mosaic = new Jimp(mosaicWidth * loadedImages[0].bitmap.width, mosaicHeight * loadedImages[0].bitmap.height);

  // Add each image to the mosaic
  for (let y = 0; y < mosaicHeight; y++) {
    for (let x = 0; x < mosaicWidth; x++) {
      const image = loadedImages[(y * mosaicWidth + x) % loadedImages.length];
      mosaic.composite(image, x * image.bitmap.width, y * image.bitmap.height);
    }
  }

  // Save the mosaic image
  mosaic.write('mosaic.jpg');
}

// Get all image paths from the dogs folder
const images = fs.readdirSync('dogs').map(file => path.join('dogs', file));

// Calculate the width and height of the mosaic based on the number of images
const mosaicWidth = Math.ceil(Math.sqrt(images.length));
const mosaicHeight = Math.ceil(images.length / mosaicWidth);

// Create the mosaic
createMosaic(images, mosaicWidth, mosaicHeight);
