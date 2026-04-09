
const axios = require('axios');

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || 'SUA_CHAVE_AQUI';

async function createPrice(productId, amount, nickname) {
    try {
        const params = new URLSearchParams();
        params.append('product', productId);
        params.append('unit_amount', amount);
        params.append('currency', 'brl');
        params.append('recurring[interval]', 'month');
        params.append('nickname', nickname);

        const response = await axios.post(
            'https://api.stripe.com/v1/prices',
            params.toString(),
            {
                auth: {
                    username: STRIPE_SECRET,
                    password: ''
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        console.log(`Created price for ${nickname}: ${response.data.id}`);
        return response.data.id;
    } catch (error) {
        console.error(`Error creating price for ${nickname}:`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

async function run() {
    await createPrice('prod_TlFD9zQvKWGHvE', 5990, 'Profissional DTF (Mensal)');
    await createPrice('prod_TlFDWBZkfd50pu', 14990, 'DTF Expert (Mensal)');
}

run();
