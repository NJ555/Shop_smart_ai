'use strict';
/**
 * LangChain Integration Layer for ShopSmart AI
 * Uses @langchain/openai and @langchain/core (LCEL RunnableSequences)
 * Connected to live TokenHarbor / DeepSeek endpoint for:
 * 1. Shopping Constraint Extraction (LCEL)
 * 2. Grounded Policy Knowledge RAG Generation (LCEL)
 * 3. Audited Ops Agent Fact Restatement & Tool Coordination (LCEL)
 */
const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate, PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const config = require('../config');
const { EXTRACTION_SYSTEM, RAG_SYSTEM, OPS_SYSTEM } = require('./prompts');
const { extractJson } = require('./llm');

let cachedChatModel = null;

function getChatModel() {
  if (!cachedChatModel) {
    if (!config.llm.apiKey) {
      const err = new Error('LLM API key not configured for LangChain (set DEEPSEEK_API_KEY or TOKENHARBOR_API_KEY in .env)');
      err.code = 'NO_LLM_KEY';
      throw err;
    }

    cachedChatModel = new ChatOpenAI({
      apiKey: config.llm.apiKey,
      configuration: {
        baseURL: config.llm.baseUrl,
      },
      model: config.llm.model,
      temperature: 0.2,
      maxTokens: 800,
      timeout: 25000,
      maxRetries: 2,
    });
  }
  return cachedChatModel;
}

/**
 * 1. Shopping Constraint Extraction via LangChain LCEL Chain
 */
async function extractConstraintsWithLangChain(query) {
  const model = getChatModel();
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', EXTRACTION_SYSTEM],
    ['user', 'Query: {query}'],
  ]);
  const parser = new StringOutputParser();
  const chain = prompt.pipe(model).pipe(parser);

  const rawOutput = await chain.invoke({ query });
  return extractJson(rawOutput);
}

/**
 * 2. Interpreted Shopping Need Phrase via LangChain LCEL Chain
 */
async function interpretShoppingNeedWithLangChain(query) {
  const model = getChatModel();
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'Rewrite as a 6-10 word shopping need phrase. Plain words only.'],
    ['user', '{query}'],
  ]);
  const parser = new StringOutputParser();
  const chain = prompt.pipe(model).pipe(parser);

  const raw = await chain.invoke({ query });
  return String(raw || '').replace(/^["']|["']$/g, '').trim();
}

/**
 * 3. Policy Knowledge RAG Synthesis via LangChain LCEL Chain
 */
async function answerRagWithLangChain(context, question) {
  const model = getChatModel();
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', RAG_SYSTEM],
    ['user', 'Context:\n{context}\n\nQuestion: {question}\nAnswer in 2-4 sentences.'],
  ]);
  const parser = new StringOutputParser();
  const chain = prompt.pipe(model).pipe(parser);

  return await chain.invoke({ context, question });
}

/**
 * 4. Autonomous Ops Agent Fact Synthesis via LangChain LCEL Chain
 */
async function rephraseOpsWithLangChain(query, verifiedFacts, draft) {
  const model = getChatModel();
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', OPS_SYSTEM],
    [
      'user',
      'User asked: {query}\nVerified facts: {facts}\nDraft: {draft}\nRestate factually in 1-3 sentences. Always explicitly state whether the order is eligible for cancellation (eligible unless SHIPPED/OUT_FOR_DELIVERY/DELIVERED/CANCELLED).',
    ],
  ]);
  const parser = new StringOutputParser();
  const chain = prompt.pipe(model).pipe(parser);

  return await chain.invoke({
    query,
    facts: JSON.stringify(verifiedFacts).slice(0, 2500),
    draft,
  });
}

module.exports = {
  getChatModel,
  extractConstraintsWithLangChain,
  interpretShoppingNeedWithLangChain,
  answerRagWithLangChain,
  rephraseOpsWithLangChain,
};
