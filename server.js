const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.use(cors());
app.use(bodyParser.json());

app.post('/recommend', async (req, res) => {
  try {
    const { targetProduct, allProducts } = req.body;

    if (!targetProduct?.name || !targetProduct?.description) {
      return res.status(400).send('Invalid target product');
    }

    const cleanProducts = allProducts
      .filter(p => p.name && p.description)
      .map(p => `${p.name}: ${p.description}`)
      .join('\n');

    const prompt = `
You are a recommendation engine for an electronics store.
ONLY return a JSON array of exactly 3 product names most similar to the target product.

Target:
${targetProduct.name}: ${targetProduct.description}

List:
${cleanProducts}

Format:
["Product A", "Product B", "Product C"]
`.trim();

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const raw = response.data.choices?.[0]?.message?.content?.trim();
    console.log('🧠 OpenRouter Response:', raw);

    const jsonStart = raw.indexOf('[');
    const jsonEnd = raw.lastIndexOf(']') + 1;
    const safeJson = raw.substring(jsonStart, jsonEnd);
    const names = JSON.parse(safeJson);

    const matched = allProducts.filter(p => names.includes(p.name));
    res.json(matched);
  } catch (err) {
    console.error('🔥 OpenRouter Error:', err.response?.data || err.message);
    res.status(500).send('OpenRouter request failed');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ OpenRouter AI Proxy running on http://0.0.0.0:${PORT}`);
});
