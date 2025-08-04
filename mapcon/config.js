// Importa a biblioteca 'dotenv', que serve para carregar variáveis de ambiente
const dotenv = require('dotenv');

// Configura o dotenv para carregar um arquivo .env específico com base no ambiente atual da aplicação
// Por exemplo:
// Se NODE_ENV = 'development', ele carregará as variáveis de .env.development
// Se NODE_ENV = 'production', ele carregará as variáveis de .env.production
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
