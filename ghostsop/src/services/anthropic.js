import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required. Copy .env.example to .env and add your key.');
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default anthropic;
