const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = 'xai-wZe6We64EHnG6ZLj8RBw01kdj7RcXbUAUO7TAxNQdjOjmYF2RppsNAkndeKGZJ3lKvcHDy9p3clpND44'; 

app.use(cors());
app.use(bodyParser.json());

app.post('/recommend', async (req, res) => {
  try {
    const { targetProduct, allProducts } = req.body;

    const prompt = `
You are an AI assistant for an electronics store.
Compare the following products and return 3 similar to the one below.

Target:
${targetProduct.name}: ${targetProduct.description}

Products:
${allProducts.map(p => `${p.name}: ${p.description}`).join('\n')}

Return a JSON array of similar product names.
    `;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
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
    console.error(err.message);
    res.status(500).send('AI request failed');
  }
});

app.listen(PORT, () => {
  console.log(`AI Proxy running on http://localhost:${PORT}`);
});
