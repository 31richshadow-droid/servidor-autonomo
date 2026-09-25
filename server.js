import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import Groq from 'groq-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Desactivar caché HTTP
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' 
});
const preference = new Preference(client);

let groq = null;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// Servir la nueva interfaz de Lili directamente
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/lili-chat', async (req, res) => {
    try {
        const { mensaje } = req.body;
        if (!groq) {
            return res.json({ respuesta: 'Hola, soy Lili. Servidor activo pero GROQ_API_KEY aún no configurada.' });
        }
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'Eres Lili, una asistente virtual inteligente y autónoma. Respondes de forma concisa y profesional en español.' },
                { role: 'user', content: mensaje }
            ],
            model: 'llama-3.3-70b-versatile',
        });

        const respuesta = chatCompletion.choices[0]?.message?.content || 'Sin respuesta';
        res.json({ respuesta });
    } catch (error) {
        console.error('Error Lili:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/crear-preferencia', async (req, res) => {
    try {
        const response = await preference.create({
            body: {
                items: [{
                    title: req.body.titulo || 'Servicio Digital Lili',
                    unit_price: Number(req.body.precio) || 100,
                    quantity: 1,
                    currency_id: 'MXN'
                }]
            }
        });
        res.json({ id: response.id, init_point: response.init_point });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Lili activo en puerto ${PORT}`);
});
