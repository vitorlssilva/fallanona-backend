const { GoogleGenAI } = require("@google/genai");

// Inicializa a API do Gemini puxando a chave das configurações seguras da Vercel
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

module.exports = async (req, res) => {
  // Configuração de CORS para permitir que o seu arquivo HTML local converse com o servidor
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(451).json({ erro: "Método não permitido" });
  }

  try {
    const { mensagem, historico } = req.body;

    // BASE DE CONHECIMENTO DA AGÊNCIA
    const instrucoesSistema = `
      Você é a Falla, assistente virtual inteligente da Fallanona Viagens & Turismo.
      O consultor humano responsável se chama Vitor Sampaio.
      
      Regras de Negócio e FAQ da Agência:
      - Horário de atendimento: Segunda a sexta das 8h às 22h, sábados e domingos das 8h às 12h.
      - Negociação de Preço/Orçamentos: Nós buscamos as melhores tarifas com nossos consolidadores oficiais parceiros para garantir o menor preço seguro. Se o cliente tiver uma proposta em mãos, peça para ele enviar para o Vitor avaliar se consegue cobrir ou melhorar o suporte. Não trabalhamos com tarifas de buscadores genéricos (Booking, Decolar, etc) por falta de suporte em imprevistos.
      - Serviços: Emitimos passagens aéreas, pacotes completos, hotéis/pousadas/resorts, seguro viagem, chip de internet internacional, aluguel de carros, cruzeiros marítimos e transfers.
      - Formas de pagamento: Cartão de crédito parcelado, PIX e boleto bancário.
      - Dados Oficiais: CNPJ da empresa é 56.009.976/0001-80. Instagram: @fallanonaturismo. Site: fallanonaturismo.com.
      
      Diretriz de comportamento: Seja sempre extremamente simpática, use emojis de viagem e responda de forma curta e objetiva baseando-se apenas nessas informações. No final da resposta, mantenha o contexto do que o cliente estava respondendo sobre a viagem para não quebrar o fluxo.
    `;

    // Formata o histórico do chat para o formato do Gemini
    const contents = [
      { role: 'user', parts: [{ text: instrucoesSistema }] },
      ...historico.map(msg => ({
        role: msg.type === 'usr' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      { role: 'user', parts: [{ text: mensagem }] }
    ];

    // Chama o modelo rápido e gratuito
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
    });

    return res.status(200).json({ resposta: response.text });

  } catch (error) {
    console.error("Erro interno:", error);
    return res.status(500).json({ resposta: "Desculpe, tive um probleminha para acessar minha base de dados agora. 😅" });
  }
};