'use strict';
const { GoogleGenerativeAI } = require('@google/generative-ai');
const density = require('./density');
const logger  = require('../utils/logger');
require('dotenv').config();

const genAI   = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model   = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const sessions = new Map(); // sessionId → history[]

const _buildSystemPrompt = () => {
  const all = density.getAll();
  const standLines = Object.entries(all)
    .filter(([id]) => id.startsWith('stand'))
    .map(([, z]) => `${z.label}: ${Math.round((z.current/z.capacity)*100)}% full`)
    .join('\n');
  const foodLines = Object.entries(all)
    .filter(([id]) => id.startsWith('food'))
    .map(([, z]) => `${z.label}: ~${z.queueMin} min wait`)
    .join('\n');

  return `You are VenueIQ, a friendly AI assistant for cricket fans at Narendra Modi Stadium, Ahmedabad, India.
Rules: Be concise (1-3 sentences). Never mention competitor venues. Never provide medical advice — refer to the first-aid station.
If asked about routing or navigation, describe verbally AND remind fan to tap the map tab for a visual route.

Live stadium data (updated every 10 seconds):
--- Stand occupancy ---\n${standLines}
--- Food queue times ---\n${foodLines}`;
};

const chat = async (sessionId, userMessage) => {
  if (!sessions.has(sessionId)) sessions.set(sessionId, []);
  const history = sessions.get(sessionId);

  const chatSession = model.startChat({
    systemInstruction: _buildSystemPrompt(),
    history,
  });

  const result = await chatSession.sendMessage(userMessage);
  const reply  = result.response.text();

  history.push({ role:'user',  parts:[{ text: userMessage }] });
  history.push({ role:'model', parts:[{ text: reply       }] });
  if (history.length > 20) history.splice(0, 2); // cap at 10 turns

  logger.info('gemini chat', { sessionId, tokens: result.response.usageMetadata?.totalTokenCount });
  return reply;
};

module.exports = { chat };