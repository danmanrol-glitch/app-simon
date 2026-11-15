import { GoogleGenAI, ThinkingLevel } from '@google/genai'
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
try {
  const stream = await ai.models.generateContentStream({
    model: 'gemini-3.8-flash',
    contents: [{ role: 'user', parts: [{ text: 'Responde solo: hola' }] }],
    config: { maxOutputTokens: 50, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } },
  })
  let out = ''
  for await (const c of stream) out += c.text ?? ''
  console.log('OK:', out)
} catch (e) { console.log('ERR', e.status ?? '', String(e.message).slice(0, 300)) }
