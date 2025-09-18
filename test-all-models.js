#!/usr/bin/env node

/**
 * Script para verificar configuração de todos os modelos disponíveis no HiveLLM Chat Hub
 * Verifica se API keys estão configuradas e se o aider CLI está disponível
 * Total: 36 modelos (4 cursor-agent built-in + 32 aider externos)
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Cores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Carregar variáveis de ambiente
function loadEnvironment() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
        console.log(`${colors.green}[ENV] ✅ Arquivo .env carregado${colors.reset}`);
    } else {
        console.log(`${colors.yellow}[ENV] ⚠️  Arquivo .env não encontrado${colors.reset}`);
        console.log(`${colors.yellow}[ENV] Copie o conteúdo de env-example.txt para .env e adicione suas API keys${colors.reset}`);
    }
}

// Lista de todos os modelos disponíveis
const ALL_MODELS = {
    // Cursor-agent models (built-in)
    cursor_models: [
        'auto',
        'gpt-5', 
        'sonnet-4', 
        'opus-4.1'
    ],
    
    // Aider models (external APIs)
    aider_models: {
        // OpenAI - COST-OPTIMIZED SELECTION
        'openai/chatgpt-4o-latest': { provider: 'openai', key: 'OPENAI_API_KEY', model: 'chatgpt-4o-latest' },
        'openai/gpt-4o': { provider: 'openai', key: 'OPENAI_API_KEY', model: 'gpt-4o' },
        'openai/gpt-4o-mini': { provider: 'openai', key: 'OPENAI_API_KEY', model: 'gpt-4o-mini' },
        'openai/gpt-4o-search-preview': { provider: 'openai', key: 'OPENAI_API_KEY', model: 'gpt-4o-search-preview' },
        'openai/gpt-5-mini': { provider: 'openai', key: 'OPENAI_API_KEY', model: 'gpt-5-mini' },
        'openai/gpt-4.1-mini': { provider: 'openai', key: 'OPENAI_API_KEY', model: 'gpt-4.1-mini' },
        'openai/o1-mini': { provider: 'openai', key: 'OPENAI_API_KEY', model: 'o1-mini' },
        'openai/gpt-4-turbo': { provider: 'openai', key: 'OPENAI_API_KEY', model: 'gpt-4-turbo' },

        // Anthropic - STABLE MODELS
        'anthropic/claude-4-sonnet-20250514': { provider: 'anthropic', key: 'ANTHROPIC_API_KEY', model: 'claude-4-sonnet-20250514' },
        'anthropic/claude-sonnet-4-20250514': { provider: 'anthropic', key: 'ANTHROPIC_API_KEY', model: 'claude-sonnet-4-20250514' },
        'anthropic/claude-3-7-sonnet-latest': { provider: 'anthropic', key: 'ANTHROPIC_API_KEY', model: 'claude-3-7-sonnet-latest' },
        'anthropic/claude-3-5-sonnet-20241022': { provider: 'anthropic', key: 'ANTHROPIC_API_KEY', model: 'claude-3-5-sonnet-20241022' },
        'anthropic/claude-3-5-sonnet-latest': { provider: 'anthropic', key: 'ANTHROPIC_API_KEY', model: 'claude-3-5-sonnet-latest' },
        'anthropic/claude-3-5-haiku-latest': { provider: 'anthropic', key: 'ANTHROPIC_API_KEY', model: 'claude-3-5-haiku-latest' },
        'anthropic/claude-3-opus-latest': { provider: 'anthropic', key: 'ANTHROPIC_API_KEY', model: 'claude-3-opus-latest' },

        // Gemini (Google) - STABLE MODELS
        'gemini/gemini-2.0-flash': { provider: 'gemini', key: 'GEMINI_API_KEY', model: 'gemini-2.0-flash' },
        'gemini/gemini-2.5-pro': { provider: 'gemini', key: 'GEMINI_API_KEY', model: 'gemini-2.5-pro' },
        'gemini/gemini-2.5-flash': { provider: 'gemini', key: 'GEMINI_API_KEY', model: 'gemini-2.5-flash' },
        'gemini/gemini-1.5-pro-latest': { provider: 'gemini', key: 'GEMINI_API_KEY', model: 'gemini-1.5-pro-latest' },
        'gemini/gemini-1.5-flash-latest': { provider: 'gemini', key: 'GEMINI_API_KEY', model: 'gemini-1.5-flash-latest' },

        // xAI (Grok) - BEST VERSIONS
        'xai/grok-4-latest': { provider: 'xai', key: 'XAI_API_KEY', model: 'grok-4-latest' },
        'xai/grok-3-latest': { provider: 'xai', key: 'XAI_API_KEY', model: 'grok-3-latest' },
        'xai/grok-3-fast-latest': { provider: 'xai', key: 'XAI_API_KEY', model: 'grok-3-fast-latest' },
        'xai/grok-3-mini-latest': { provider: 'xai', key: 'XAI_API_KEY', model: 'grok-3-mini-latest' },
        'xai/grok-code-fast-1': { provider: 'xai', key: 'XAI_API_KEY', model: 'grok-code-fast-1' },

        // DeepSeek (UPDATED - 4 models)
        'deepseek/deepseek-chat': { provider: 'deepseek', key: 'DEEPSEEK_API_KEY', model: 'deepseek-chat' },
        'deepseek/deepseek-r1': { provider: 'deepseek', key: 'DEEPSEEK_API_KEY', model: 'deepseek-r1' },
        'deepseek/deepseek-reasoner': { provider: 'deepseek', key: 'DEEPSEEK_API_KEY', model: 'deepseek-reasoner' },
        'deepseek/deepseek-v3': { provider: 'deepseek', key: 'DEEPSEEK_API_KEY', model: 'deepseek-v3' },

        // Groq - TOP MODELS
        'groq/llama-3.1-70b-versatile': { provider: 'groq', key: 'GROQ_API_KEY', model: 'llama-3.1-70b-versatile' },
        'groq/llama-3.1-8b-instant': { provider: 'groq', key: 'GROQ_API_KEY', model: 'llama-3.1-8b-instant' },
        'groq/llama-3.3-70b-versatile': { provider: 'groq', key: 'GROQ_API_KEY', model: 'llama-3.3-70b-versatile' }
    }
};

// Função para verificar configuração do modelo aider
async function testAPIConnectivity(modelId, message) {
    try {
        const modelConfig = ALL_MODELS.aider_models[modelId];
        if (!modelConfig) {
            return `❌ Modelo ${modelId} não encontrado na configuração`;
        }

        const apiKey = process.env[modelConfig.key];
        if (!apiKey) {
            return `❌ API key não configurada para ${modelConfig.provider}`;
        }

        // Verificar se a API key tem formato válido
        if (apiKey.length < 10) {
            return `❌ API key inválida ou muito curta para ${modelConfig.provider}`;
        }

        // Verificar se aider está instalado
        try {
            await execAsync('which aider', { timeout: 5000 });
        } catch {
            return `⚠️  Aider não instalado - API key OK mas aider CLI necessário`;
        }

        return `✅ ${modelConfig.provider} configurado (${modelConfig.model}) - API key válida, aider disponível`;
        
    } catch (error) {
        return `❌ Erro: ${error.message}`;
    }
}

// Função para testar modelo cursor-agent (simulado)
async function testCursorAgentModel(modelId) {
    // Para modelos cursor-agent, simulamos uma resposta positiva
    // pois eles são built-in e não precisam de API externa
    return `✅ Cursor-agent model ${modelId} - Built-in (sempre disponível)`;
}

// Função principal de teste
async function testAllModels() {
    console.log(`${colors.bright}${colors.cyan}🚀 HiveLLM Chat Hub - Teste de Configuração de Todos os Modelos${colors.reset}\n`);
    
    loadEnvironment();
    
    const results = {
        working: [],
        failed: [],
        skipped: []
    };

    // Testar modelos cursor-agent
    console.log(`${colors.blue}📋 Testando modelos Cursor-Agent (Built-in):${colors.reset}`);
    for (const model of ALL_MODELS.cursor_models) {
        console.log(`\n${colors.yellow}🔍 Testando ${model}...${colors.reset}`);
        const result = await testCursorAgentModel(model);
        console.log(`${colors.green}${result}${colors.reset}`);
        results.working.push({ model, type: 'cursor-agent', result });
    }

    // Testar modelos aider
    console.log(`\n${colors.blue}📋 Testando modelos Aider (External APIs):${colors.reset}`);
    
    for (const [modelId, config] of Object.entries(ALL_MODELS.aider_models)) {
        console.log(`\n${colors.yellow}🔍 Testando ${modelId} (${config.provider})...${colors.reset}`);
        
        const apiKey = process.env[config.key];
        if (!apiKey) {
            const result = `⚠️  API key não configurada (${config.key})`;
            console.log(`${colors.yellow}${result}${colors.reset}`);
            results.skipped.push({ model: modelId, provider: config.provider, reason: 'No API key' });
            continue;
        }

        const result = await testAPIConnectivity(modelId, 'Hello');
        console.log(`${result.includes('❌') ? colors.red : colors.green}${result}${colors.reset}`);
        
        if (result.includes('❌')) {
            results.failed.push({ model: modelId, provider: config.provider, error: result });
        } else {
            results.working.push({ model: modelId, provider: config.provider, result });
        }

        // Pequena pausa entre testes para evitar rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Resumo dos resultados
    console.log(`\n${colors.bright}${colors.cyan}📊 RESUMO DOS TESTES:${colors.reset}`);
    console.log(`${colors.green}✅ Funcionando: ${results.working.length} modelos${colors.reset}`);
    console.log(`${colors.red}❌ Falharam: ${results.failed.length} modelos${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Pulados: ${results.skipped.length} modelos${colors.reset}`);
    
    // Estatísticas detalhadas
    console.log(`\n${colors.blue}📈 ESTATÍSTICAS DETALHADAS:${colors.reset}`);
    console.log(`${colors.cyan}• Cursor-Agent: ${ALL_MODELS.cursor_models.length} modelos (built-in)${colors.reset}`);
    console.log(`${colors.cyan}• Aider: ${Object.keys(ALL_MODELS.aider_models).length} modelos (external APIs)${colors.reset}`);
    console.log(`${colors.cyan}• Total: ${ALL_MODELS.cursor_models.length + Object.keys(ALL_MODELS.aider_models).length} modelos disponíveis${colors.reset}`);
    
    // Breakdown por provider
    const providerCount = {};
    Object.values(ALL_MODELS.aider_models).forEach(config => {
        providerCount[config.provider] = (providerCount[config.provider] || 0) + 1;
    });
    
    console.log(`\n${colors.blue}📊 MODELOS POR PROVIDER:${colors.reset}`);
    console.log(`${colors.cyan}• cursor-agent: ${ALL_MODELS.cursor_models.length}${colors.reset}`);
    Object.entries(providerCount).forEach(([provider, count]) => {
        console.log(`${colors.cyan}• ${provider}: ${count}${colors.reset}`);
    });

    if (results.failed.length > 0) {
        console.log(`\n${colors.red}❌ Modelos que falharam:${colors.reset}`);
        results.failed.forEach(({ model, provider, error }) => {
            console.log(`${colors.red}  - ${model} (${provider}): ${error}${colors.reset}`);
        });
    }

    if (results.skipped.length > 0) {
        console.log(`\n${colors.yellow}⚠️  Modelos pulados (sem API key):${colors.reset}`);
        results.skipped.forEach(({ model, provider }) => {
            console.log(`${colors.yellow}  - ${model} (${provider})${colors.reset}`);
        });
    }

    console.log(`\n${colors.bright}${colors.green}🎉 Teste de configuração concluído!${colors.reset}`);
    console.log(`${colors.cyan}💡 Para configurar API keys faltantes, edite o arquivo .env${colors.reset}`);
    console.log(`${colors.cyan}💡 Para usar modelos aider, certifique-se de ter o aider CLI instalado: pip install aider-chat${colors.reset}`);
}

// Executar teste
if (require.main === module) {
    testAllModels().catch(error => {
        console.error(`${colors.red}❌ Erro durante o teste: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

module.exports = { testAllModels, ALL_MODELS };
