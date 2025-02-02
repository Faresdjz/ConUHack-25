import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

// Function to generate a contextual weapon if Claude fails
const generateContextualWeapon = (userRequest) => {
  const request = userRequest.toLowerCase();
  let weaponBase = 'Gun';
  let prefix = '';
  let stats = {
    damage: 50,
    fireRate: 5,
    speed: 5,
    durability: 50
  };

  // Analyze request for weapon type
  if (request.includes('fast') || request.includes('quick')) {
    prefix = 'Rapid';
    stats.fireRate = 9;
    stats.speed = 8;
    stats.damage = 30;
  } else if (request.includes('strong') || request.includes('powerful')) {
    prefix = 'Heavy';
    stats.damage = 90;
    stats.fireRate = 3;
    stats.speed = 3;
  } else if (request.includes('balanced')) {
    prefix = 'Tactical';
    stats.damage = 60;
    stats.fireRate = 6;
    stats.speed = 6;
  }

  // Determine weapon type
  if (request.includes('rifle')) weaponBase = 'Rifle';
  else if (request.includes('pistol')) weaponBase = 'Pistol';
  else if (request.includes('shotgun')) weaponBase = 'Shotgun';
  else if (request.includes('laser')) weaponBase = 'Laser';
  else if (request.includes('plasma')) weaponBase = 'Plasma';
  else if (request.includes('rocket')) {
    weaponBase = 'Launcher';
    stats.damage = 100;
    stats.fireRate = 1;
  }

  // Add elemental effects
  if (request.includes('fire') || request.includes('flame')) {
    prefix = 'Flame';
    stats.damage += 20;
  } else if (request.includes('ice') || request.includes('frost')) {
    prefix = 'Frost';
    stats.speed += 2;
  } else if (request.includes('electric') || request.includes('lightning')) {
    prefix = 'Thunder';
    stats.fireRate += 2;
  }

  const name = `${prefix} ${weaponBase}`;
  const price = Math.min(1000, Math.floor((stats.damage + stats.fireRate * 10 + stats.speed * 10) * 5));
  
  return {
    type: "weapon",
    name: name,
    price: price,
    stats: stats,
    description: `A ${prefix.toLowerCase()} weapon that adapts to your combat style. Generated from: ${userRequest}`,
    imageDescription: `Pixel art of a ${name.toLowerCase()} with ${prefix.toLowerCase()} effects, in a retro game style`
  };
};

// Function to get weapon data from Claude
const getWeaponFromClaude = async (messages) => {
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
        messages: messages,
        system: SYSTEM_PROMPT + "\nIMPORTANT: You must respond with ONLY a valid JSON object, no additional text or explanations.",
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.content || !Array.isArray(data.content)) {
      throw new Error('Invalid API response format');
    }

    const content = data.content[0].text.trim();
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Invalid JSON response');
    }

    const jsonContent = content.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Claude API error:', error);
    return null;
  }
};

// Function to get image from DALL-E
const getImageFromDallE = async (description) => {
  try {
    const imageResponse = await openai.images.generate({
      model: "dall-e-2",
      prompt: `Create a pixel art style image of: ${description}. The image should be simple, clean, and in a retro pixel art style suitable for a 2D game.`,
      size: "256x256",
      n: 1,
    });
    return imageResponse.data[0].url;
  } catch (error) {
    console.error('DALL-E API error:', error);
    return null;
  }
};

app.post('/api/chat', async (req, res) => {
  try {
    // First, try to get weapon data from Claude
    let weaponData = await getWeaponFromClaude(req.body.messages);
    
    // If Claude fails, use our contextual weapon generator
    if (!weaponData) {
      console.log('Using contextual weapon generator');
      weaponData = generateContextualWeapon(req.body.messages[0].content);
    }

    // Then, separately try to get an image from DALL-E
    const imageUrl = await getImageFromDallE(weaponData.imageDescription);

    // Combine the results
    const finalResponse = {
      ...weaponData,
      image: imageUrl
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
