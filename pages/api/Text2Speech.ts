
import axios from 'axios';
import { ELEVEN_LABS_API_KEY } from '../../utils/app/const';

// Define a function called textToSpeech that takes in a string called inputText as its argument.
const textToSpeech = async (inputText: any) => {
  // Set the API key for ElevenLabs API. 
  // Do not use directly. Use environment variables.
  const API_KEY = ELEVEN_LABS_API_KEY;
  // Set the ID of the voice to be used.
  const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

  const speechDetails = await axios({
    method: 'post',
    url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    data: {
      text: inputText, // Pass in the inputText as the text to be converted to speech.
    },
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': `${API_KEY}`,
      'Content-Type': 'application/json',
    },
    responseType: 'arraybuffer'
  });

  // Return the binary audio data received from the API response.
  return speechDetails.data;
};

// Export the textToSpeech function as the default export of this module.
export default textToSpeech;