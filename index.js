import express from 'express';  // Para criar o servidor
import fetch from 'node-fetch'; // Para fazer requisições HTTP
import * as cheerio from 'cheerio';  // Para fazer o parsing do HTML
import cors from 'cors'; // Importa o pacote CORS

const app = express();
const port = 3000;

// Permite requisições de qualquer origem (ou você pode restringir a origens específicas)
app.use(cors()); // Habilita o CORS globalmente

// Função para consultar a placa e retornar os dados
async function consultarPlaca({ placa }) {
  console.log('Consultando a placa:', placa); // Log para verificar o valor da placa

  // Realiza a requisição para a URL com a placa
  const req = await fetch(`https://www.tabelafipebrasil.com/placa?placa=${placa}`, {
    method: 'GET',
    headers: {
      'sec-ch-ua': '"Brave";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'upgrade-insecure-requests': '1',
      'Referer': 'https://www.tabelafipebrasil.com/placa',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Accept-Encoding': 'identity' // Desabilita a compressão
    },
  });

  const res = await req.text(); // Obtemos o HTML da resposta
  console.log('HTML recebido:', res); // Log para verificar o HTML que está sendo retornado

  const $ = cheerio.load(res); // Carregamos o HTML no cheerio
  const data1 = {};

  // Pegando os dados da primeira tabela
  const table1 = $('.fipeTablePriceDetail');
  table1.find('tr').each((index, element) => {
    const key = $(element).find('td').first().text().replace(':', '').trim();
    const value = $(element).find('td').last().text().trim();
    data1[key] = value;
  });

  // Pegando os dados da segunda tabela
  const table2 = $('.fipe-desktop');
  table2.find('tr').each((index, element) => {
    if (index === 0) return; // Ignora o cabeçalho da tabela
    const row = {};
    $(element).find('td').each((i, td) => {
      const text = $(td).text().trim();
      if (i === 0) row['Código FIPE'] = text;
      if (i === 1) row['Modelo'] = text;
      if (i === 2) row['Valor'] = text;
    });
    data1['Fipe'] = row;
  });

  // Se não houver dados, retornamos um erro
  if (Object.keys(data1).length === 0) {
    console.log('Nenhum dado encontrado para a placa:', placa); // Log quando não encontrar dados
    return { error: 'Placa not found.' };
  }

  console.log('Dados encontrados:', data1); // Log os dados que foram encontrados
  return data1;
}

// Rota para consultar a placa
app.get('/consultarPlaca', async (req, res) => {
  const { placa } = req.query;

  // Verifica se a placa foi informada
  if (!placa) {
    return res.status(400).json({ error: 'A placa é obrigatória.' });
  }

  try {
    const data = await consultarPlaca({ placa });
    console.log('Dados retornados para a placa:', placa, data); // Log do retorno de dados
    return res.json(data);
  } catch (error) {
    console.error('Erro ao consultar placa:', error); // Log do erro
    return res.status(500).json({ error: 'Erro ao consultar placa.' });
  }
});

// Inicializa o servidor na porta 3000, ouvindo em todas as interfaces de rede
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port} e ouvindo em todas as interfaces de rede.`);
});
