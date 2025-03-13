const express = require('express');
const { Client } = require('pg'); // Para conectar ao PostgreSQL
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js'); // Para upload de imagens no Supabase Storage

dotenv.config(); // Carrega variáveis de ambiente do arquivo .env

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do PostgreSQL (Supabase)
const fs = require('fs');
const client = new Client({
    host: process.env.DB_HOST || 'db.vnkmnjqkszlmkstndlvg.supabase.co', // Host do Supabase
    user: process.env.DB_USER || 'postgres', // Usuário
    password: process.env.DB_PASSWORD || 'EazyE019856*', // Senha
    database: process.env.DB_NAME || 'postgres', // Nome do banco de dados
    port: process.env.DB_PORT || 5432, // Porta
    ssl: { 
        rca: fs.readFileSync('noticiario-backend\certificadossl').toString(),
    },
});

// Conectar ao PostgreSQL
client.connect()
    .then(() => console.log('Conectado ao Supabase!'))
    .catch(err => console.error('Erro ao conectar ao Supabase:', err));

// Configuração do Supabase Storage
const supabaseUrl = process.env.SUPABASE_URL || 'https://vnkmnjqkszlmkstndlvg.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZua21uanFrc3psbWtzdG5kbHZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTgwMTk1MCwiZXhwIjoyMDU3Mzc3OTUwfQ.FowzBG52p15REd17EH72MiU-J_q1gmFEFvHQssbm8AY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet()); // Adiciona headers de segurança

// Rota raiz para teste
app.get('/', (req, res) => {
    res.send('Servidor está rodando!');
});

// Rota de login
app.post('/login', (req, res) => {
    const { senha } = req.body;

    // Senha correta (em produção, use hash e não armazene em texto plano)
    const senhaCorreta = 'senhaSegura123'; // Substitua pela senha correta

    if (senha === senhaCorreta) {
        res.json({ success: true, message: 'Login bem-sucedido!' });
    } else {
        res.status(401).json({ success: false, message: 'Senha incorreta!' });
    }
});

// Rota para listar todas as notícias
app.get('/noticias', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const result = await client.query('SELECT * FROM noticias LIMIT $1 OFFSET $2', [limit, offset]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rota para buscar uma notícia por ID
app.get('/noticias/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await client.query('SELECT * FROM noticias WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notícia não encontrada' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rota para adicionar uma notícia
app.post('/noticias', async (req, res) => {
    const { titulo, conteudo, imagem, categoria } = req.body;

    if (!titulo || !conteudo || !imagem || !categoria) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        const query = 'INSERT INTO noticias (titulo, conteudo, imagem, categoria) VALUES ($1, $2, $3, $4) RETURNING *';
        const values = [titulo, conteudo, imagem, categoria];
        const result = await client.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rota para editar uma notícia
app.put('/noticias/:id', async (req, res) => {
    const { id } = req.params;
    const { titulo, conteudo, imagem, categoria } = req.body;

    if (!titulo || !conteudo || !imagem || !categoria) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        const query = 'UPDATE noticias SET titulo = $1, conteudo = $2, imagem = $3, categoria = $4 WHERE id = $5 RETURNING *';
        const values = [titulo, conteudo, imagem, categoria, id];
        const result = await client.query(query, values);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rota para excluir uma notícia
app.delete('/noticias/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await client.query('DELETE FROM noticias WHERE id = $1', [id]);
        res.json({ message: 'Notícia excluída com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rota para upload de imagens
app.post('/upload', async (req, res) => {
    const { file } = req.body; // Arquivo de imagem enviado pelo frontend

    try {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
            .from('imagens') // Nome do bucket
            .upload(fileName, file);

        if (error) {
            throw error;
        }

        const imageUrl = `${supabaseUrl}/storage/v1/object/public/imagens/${fileName}`;
        res.json({ url: imageUrl });
    } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
    }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});