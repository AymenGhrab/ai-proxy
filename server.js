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
You are an AI assistant for an electronics store.
Your job is to recommend 3 similar products based on a given target product.

Target product:
${targetProduct.name}: ${targetProduct.description}

Product list to compare with:
${cleanProducts}

ONLY return a valid JSON array of 3 product names. No explanation.
Format example:
["Gaming Laptop Z", "Gaming Monitor", "Office Laptop A"]
`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const raw = response.data.choices?.[0]?.message?.content?.trim();
    console.log('🧠 AI Raw Response:', raw);

    // Try to safely extract JSON array
    const jsonStart = raw.indexOf('[');
    const jsonEnd = raw.lastIndexOf(']') + 1;
    const safeJson = raw.substring(jsonStart, jsonEnd);

    const names = JSON.parse(safeJson);
    const matchedProducts = allProducts.filter(p => names.includes(p.name));

    console.log('✅ Matched Products:', matchedProducts);
    res.json(matchedProducts);
  } catch (err) {
    console.error('🔥 AI Server Error:', err.message);
    res.status(500).send('AI request failed');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ AI Proxy running on http://0.0.0.0:${PORT}`);
});
