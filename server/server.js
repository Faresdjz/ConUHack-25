import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// System prompt for game context
const SYSTEM_PROMPT = `You are an AI game assistant managing a top-down shooter game. IMPORTANT: You must ALWAYS respond with a valid JSON object, never with natural language.

Your role is to generate game items based on user requests. For EVERY request, you must return a JSON object with this EXACT structure:
{
  "type": "weapon"|"item"|"obstacle",
  "name": "string",
  "price": number,
  "stats": {
    "damage": number,
    "fireRate": number,
    "speed": number,
    "durability": number
  },
  "description": "string",
  "imageDescription": "string"
}

Guidelines:
- ALL fields are required
- type must be one of: "weapon", "item", or "obstacle"
- price should be between 100 and 1000 based on power
- stats should reflect the item's capabilities
- description should be a brief explanation of the item
- imageDescription should describe the item for pixel art generation

Example valid response:
{
  "type": "weapon",
  "name": "Plasma Rifle",
  "price": 500,
  "stats": {
    "damage": 75,
    "fireRate": 3,
    "speed": 5,
    "durability": 100
  },
  "description": "A high-powered energy weapon that fires concentrated plasma bolts",
  "imageDescription": "Pixel art of a sleek futuristic rifle with glowing blue energy cells"
}`;

app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        messages: req.body.messages,
        system: SYSTEM_PROMPT + "\nIMPORTANT: You must respond with ONLY a valid JSON object, no additional text or explanations.",
        temperature: 0.7
      })
    });
      console.log(response);
      console.log("--------------------------------------------");
      console.log(req.body.messages);
      console.log("==========================================");
      const data = await response.json();
      console.log(data);
      
      // Handle Claude API response structure
      let content = '';
      if (data.content && Array.isArray(data.content)) {
        content = data.content[0].text.trim();
        // Remove any non-JSON text before the first {
        const jsonStart = content.indexOf('{');
        if (jsonStart !== -1) {
          content = content.substring(jsonStart);
        }
        // Remove any non-JSON text after the last }
        const jsonEnd = content.lastIndexOf('}');
        if (jsonEnd !== -1) {
          content = content.substring(0, jsonEnd + 1);
        }
      } else if (data.error) {
        throw new Error(data.error.message || 'API Error');
      } else {
        throw new Error('Invalid API response format');
      }
      
      // Parse and validate the content
      const parsedContent = JSON.parse(content);
      if (!parsedContent.type || !parsedContent.name || !parsedContent.price || 
          !parsedContent.stats || !parsedContent.description || !parsedContent.imageDescription) {
        throw new Error('Missing required fields in response');
      }
      
      // Generate image based on the description
      const imageResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Generate a pixel art style image of: ${parsedContent.imageDescription}`
            }
          ]
        })
      });

      const imageData = await imageResponse.json();
      
      // Combine item data with generated image
      const finalResponse = {
        ...parsedContent,
        image: imageData.content && imageData.content[0] ? imageData.content[0].image : null
      };

      res.json({ content: [{ text: JSON.stringify(finalResponse) }] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      content: [{ 
        text: JSON.stringify({
          error: true,
          message: "There was a problem connecting to the game server. Please try again.",
          details: error.message
        })
      }] 
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
