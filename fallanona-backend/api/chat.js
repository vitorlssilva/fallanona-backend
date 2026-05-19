import { GoogleGenAI } from "@google/genai";

// Inicializa o cliente do Gemini usando a variável de ambiente configurada na Vercel
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Configura o runtime para Edge (resposta ultra rápida e barata na Vercel)
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Garante que a API só responda a requisições do tipo POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405 });
  }

  try {
    const { message, history } = await req.json();

    // Contexto institucional e regras de comportamento do robô
    const systemInstruction = `
Você é o assistente virtual inteligente da Fallanona Viagens & Turismo (CNPJ: 56.009.976/0001-80).
Sua missão é atender os clientes com excelência, seguindo a filosofia de "Propósito > Ruído": foque no que importa, seja prestativo, profissional e use emojis de forma natural para manter a conversa leve.

DIRETRIZES DE IDENTIDADE INSTITUCIONAL (Responda com segurança e clareza se for perguntado):
1. Quem é Vítor? O Vítor Sampaio é o nosso consultor e gestor de operações especialista. Ele possui quase duas décadas de experiência em infraestrutura, redes e atendimento de alto padrão, cuidando pessoalmente da curadoria e dos detalhes de cada roteiro.
2. Nome da empresa: Fallanona Viagens & Turismo.
3. Tempo de mercado / Confiabilidade: Embora sejamos uma agência com posicionamento moderno e lançada recentemente, operamos com os maiores e mais conhecidos parceiros e consolidadores do turismo global, garantindo total segurança e suporte do planejamento até o retorno.

REGRA DE OURO DO FLUXO ("RESPONDE E PUXA"):
Você tem total liberdade para responder a qualquer dúvida direta do cliente (sobre quem é o Vítor, CNPJ, segurança, etc.). No entanto, você NUNCA deve deixar a conversa morrer ou entrar em looping. Toda resposta sua a uma dúvida institucional deve terminar obrigatoriamente engajando o cliente de volta no ponto em que o fluxo de vendas parou.

FLUXO DE QUALIFICAÇÃO DE VENDAS (Siga estas etapas de forma flexível baseando-se no histórico):
1. DESTINO: Descubra para onde o cliente quer ir (cidade, país ou região). Se o cliente disser apenas um local pequeno ou ambíguo, valide de forma inteligente (ex: "Boa escolha! Já anotei Espanha.").
2. PERFIL: Entenda quem vai viajar (Sozinho, Casal/A dois, Família, Corporativo).
3. PERÍODO: Pergunte a data pretendida ou o mês (ex: "Julho/Férias", "Fim do ano", "Próximos 3 meses").
4. PASSAGEIROS: Quantidade de adultos e se há crianças.
5. ORÇAMENTO: Faixa estimada por pessoa (até R$3k, entre R$3k e R$6k, R$6k a R$12k, acima de R$12k). Se o cliente disser que não sabe ou prefere aguardar seu orçamento, valide que o Vítor monta propostas personalizadas sem custo e sem compromisso, mas peça para ele escolher uma faixa aproximada apenas para direcionar a pesquisa.
6. CONTATO: Nome completo, E-mail e WhatsApp para envio da proposta personalizada.

Mantenha as respostas curtas, scannáveis (use quebras de linha) e evite textos gigantescos.
`;

    // Formata o histórico recebido do front-end para o padrão estruturado do Gemini
    const formattedMessages = [];
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        formattedMessages.push({
          role: msg.role === 'bot' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        });
      });
    }

    // Adiciona a última mensagem enviada pelo usuário ao final do array
    formattedMessages.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Executa a chamada ao modelo Gemini 1.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: formattedMessages,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    // Retorna a resposta do robô para o cliente
    return new Response(JSON.stringify({ reply: response.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Erro interno no servidor da API:", error);
    return new Response(JSON.stringify({ error: 'Erro interno ao processar a requisição' }), { status: 500 });
  }
}
