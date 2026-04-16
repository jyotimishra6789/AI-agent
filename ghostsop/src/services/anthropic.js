import Anthropic from '@anthropic-ai/sdk';

if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
  throw new Error('VITE_ANTHROPIC_API_KEY is required. Copy .env.example to .env and add your key.');
}

const anthropic = new Anthropic({ 
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

export default anthropic;
