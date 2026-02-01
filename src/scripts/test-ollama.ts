#!/usr/bin/env tsx

/**
 * Test script to verify Ollama connection and model availability
 */

import { Ollama } from 'ollama';

const TEST_MESSAGES = [
  {
    text: 'Ciao, ci vediamo domani alle 10?',
    expected: 'low',
    description: 'Normal message',
  },
  {
    text: 'ti amoooo tantissimooo!!! mi manchiii da morireee',
    expected: 'high',
    description: 'Emotional + typos',
  },
  {
    text: 'PERCHE NON MI RISPONDI???? HO BISOGNO DI PARLARTI!!!',
    expected: 'high',
    description: 'Caps + punctuation',
  },
  {
    text: 'sn un po trsite stasrea... ti pensooo sempreee',
    expected: 'medium-high',
    description: 'Typos + emotional',
  },
];

async function main() {
  console.log('🧪 Testing Ollama Connection\n');

  const ollama = new Ollama({ host: 'http://localhost:11434' });

  // Test connection
  console.log('1. Testing connection...');
  try {
    const models = await ollama.list();
    console.log('   ✅ Connected to Ollama');
    console.log(`   📦 Available models: ${models.models.map((m) => m.name).join(', ')}\n`);
  } catch (error) {
    console.log('   ❌ Cannot connect to Ollama');
    console.log('   Make sure Ollama is running: ollama serve');
    process.exit(1);
  }

  // Test model
  const model = process.argv[2] || 'llama3.2:3b';
  console.log(`2. Testing model: ${model}`);

  try {
    const response = await ollama.chat({
      model,
      messages: [{ role: 'user', content: 'Rispondi solo "OK" se funzioni.' }],
    });
    console.log(`   ✅ Model response: ${response.message.content.trim()}\n`);
  } catch (error: any) {
    console.log(`   ❌ Model error: ${error.message}`);
    console.log(`   Try: ollama pull ${model}`);
    process.exit(1);
  }

  // Test analysis
  console.log('3. Testing drunk detection analysis:\n');

  const systemPrompt = `Sei un analizzatore di messaggi. Rispondi SOLO con JSON:
{"drunkScore": <0.0-1.0>, "confidence": <0.0-1.0>, "indicators": [], "reasoning": "..."}`;

  for (const test of TEST_MESSAGES) {
    console.log(`   📝 "${test.text.substring(0, 50)}..."`);
    console.log(`      Expected: ${test.expected}`);

    try {
      const response = await ollama.chat({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analizza: "${test.text}"` },
        ],
        format: 'json',
        options: { temperature: 0.3 },
      });

      const result = JSON.parse(response.message.content);
      const score = result.drunkScore || 0;
      const level =
        score >= 0.75 ? 'high' : score >= 0.5 ? 'medium' : 'low';

      console.log(`      Result: ${level} (score: ${score.toFixed(2)})`);
      console.log(`      Indicators: ${result.indicators?.join(', ') || 'none'}`);
      console.log('');
    } catch (error: any) {
      console.log(`      ❌ Error: ${error.message}\n`);
    }
  }

  console.log('✅ All tests completed!');
}

main().catch(console.error);
