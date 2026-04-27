const fs = require('fs');
const axios = require('axios');

// Function to read words from a file
function readWordsFromFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return data.split('\n').map(word => word.trim());
  } catch (error) {
    console.error('Error reading file:', error.message);
    return [];
  }
}

// Function to make API requests for each word
async function makeApiRequests(words, apiUrl, successFile) {
  try {
    const successWords = [];

    for (const word of words) {
        if(word.length <= 2 || word.length > 5) continue;
      try {
        // Make API request
        const response = await axios.get(`${apiUrl}/${word}`);

        // Check if the request was successful (adjust as needed based on your API)
        if (response.status === 200) {
          successWords.push(word);
          console.log(`Success for word: ${word}`);
        } else {
          console.log(`API request failed for word: ${word}`);
        }
      } catch (error) {
        console.error(`Error making API request for word ${word}:`, error.message);
      }
    }

    // Save successful words to another file
    fs.writeFileSync(successFile, successWords.join('\n'), 'utf-8');
    console.log(`Successfully stored ${successWords.length} words in ${successFile}`);
  } catch (error) {
    console.error('Error processing words:', error.message);
  }
}

// Specify your file paths and API URL
const inputFile = 'input.txt'; // Change this to your input file path
const outputFile = 'output.txt'; // Change this to your output file path
const apiEndpoint = 'https://api.dictionaryapi.dev/api/v2/entries/en'; // Change this to your API endpoint

// Read words from the file
const words = readWordsFromFile(inputFile);

// Make API requests and store successful words
makeApiRequests(words, apiEndpoint, outputFile);
