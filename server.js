const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;


const OPENROUTER_API_KEY = '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';

app.use(cors());
app.use(bodyParser.json());

app.post('/recommend', async (req, res) => {
  try {
    const { targetProduct, allProducts } = req.body;

    const prompt = `
You are an AI assistant for an electronics store.
Your job is to recommend 3 similar products based on a given target product.

Target product:
${targetProduct.name}: ${targetProduct.description}

Compare it to the following products:
${allProducts.map(p => `${p.name}: ${p.description}`).join('\n')}

Your answer must ONLY be a valid JSON array of 3 product names. For example:
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
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = response.data.choices[0].message.content;

    const matchNames = JSON.parse(result);
    const matchedProducts = allProducts.filter(p => matchNames.includes(p.name));

    res.json(matchedProducts);
  } catch (err) {
    console.error('AI Error:', err.message);
    res.status(500).send('AI request failed');
  }
});

app.listen(PORT, () => {
  console.log(`✅ AI Proxy running on http://localhost:${PORT}`);
});
