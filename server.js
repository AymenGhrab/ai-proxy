const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
You are a smart product recommendation AI.
Based on the target product below, return ONLY a JSON array of 3 similar product names (no explanation).

Target Product:
${targetProduct.name}: ${targetProduct.description}

Compare to the following products:
${cleanProducts}

Format:
["Product A", "Product B", "Product C"]
`.trim();

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const raw = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log('🧠 Gemini Raw Response:', raw);

    const jsonStart = raw.indexOf('[');
    const jsonEnd = raw.lastIndexOf(']') + 1;
    const safeJson = raw.substring(jsonStart, jsonEnd);
    const names = JSON.parse(safeJson);

    const matchedProducts = allProducts.filter(p => names.includes(p.name));
    res.json(matchedProducts);
  } catch (err) {
    console.error('🔥 Gemini Error:', err.response?.data || err.message);
    res.status(500).send('Gemini request failed');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Gemini AI Proxy running on http://0.0.0.0:${PORT}`);
});
