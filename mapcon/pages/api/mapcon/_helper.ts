// Importa o tipo NextApiRequest do Next.js para tipar corretamente a requisição
import type { NextApiRequest } from "next";

// Define o caractere de indentação (usado para formatação visual no log)
const indentChar = '\t';

/**
 * Função recursiva que formata objetos de forma "bonita" para exibição em console,
 * com indentação e coloração ANSI (para terminais que suportam).
 * 
 * @param obj - Objeto a ser formatado
 * @param name - Nome do grupo de dados (ex: "Body", "Query")
 * @param depth - Nível de profundidade (usado para indentação recursiva)
 * @returns string formatada para exibição
 */
function PrettyOBJ(obj: object, name: string, depth = 1): string {
    let indent = indentChar.repeat(depth); // Cria indentação baseada na profundidade atual
    let prettyObj = `${indent}\x1b[93m${name}:\x1b[0m {`; // Começa a linha com o nome do grupo (em amarelo ANSI)

    if (obj && Object.keys(obj).length > 0) {
        prettyObj += '\n';
        for (const key in obj) {
            const value = obj[key];
            if (value !== null && typeof value === 'object') {
                // Se o valor for um objeto, chama recursivamente para formatar
                prettyObj += PrettyOBJ(value, key, depth + 1);
            } else {
                // Caso contrário, exibe a chave e o valor simples
                prettyObj += `${indentChar.repeat(depth + 1)}${key}: ${value} \n`;
            }
        }
        prettyObj += `${indent}}\n`; // Fecha o bloco
    } else {
        prettyObj += '}\n'; // Objeto vazio
    }

    return prettyObj;
}

/**
 * Função que exibe no console os detalhes da requisição recebida,
 * incluindo corpo (body), query params e o autor (se enviado).
 * 
 * @param filename - Caminho do arquivo que chamou a função (usado para mostrar no log)
 * @param req - Objeto da requisição HTTP
 */
function LogRequest(filename, req: NextApiRequest) {
    // Determina o separador de caminhos conforme o sistema operacional (Windows usa '\')
    const pathSeparator = process.platform === 'win32' ? '\\' : '/';

    // Divide o caminho do arquivo em partes
    const pathParts = filename.split(pathSeparator);

    // Pega o nome da pasta anterior ao arquivo (ex: 'api') e o nome do arquivo em si
    const lastDir = pathParts[pathParts.length - 2];
    const fileName = pathParts[pathParts.length - 1];

    // Extrai os dados de query e body da requisição
    const query = req.query;
    const body = req.body;

    let user;

    // Verifica se há um objeto 'user' no body
    if (body && body['user']) {
        user = body['user'];
        delete body['user']; // Remove o campo 'user' para não duplicar a exibição
    } 
    // Ou, se os dados de user vierem pela query string, reconstrói o objeto
    else if (query && query['user[id]'] && query['user[perfil]']) {
        user = {
            id: query['user[id]'],
            perfil: query['user[perfil]'],
        }
        delete query['user[id]'];
        delete query['user[perfil]'];
    }    

    // Formata os objetos em strings "bonitas"
    const queryString = PrettyOBJ(query, 'Query');
    const bodyString = PrettyOBJ(req.body, 'Body');
    const authorString = PrettyOBJ(user, 'Author');

    // Pega data e hora atual
    const date = new Date();

    // Exibe o log formatado no console com cores ANSI
    console.debug(`\x1b[92mReceived request:\x1b[0m ${date.toLocaleDateString()+" "+date.toLocaleTimeString()}
\x1b[93m${indentChar}Method:\x1b[0m ${req.method} \x1b[91mat file:\x1b[0m \x1b[4m${lastDir}/${fileName}\x1b[0m
${bodyString}
${queryString}
${authorString}`
    );
}

// Exporta a função para ser usada em outros arquivos
export { LogRequest };
