# ValidaBlog

Sistema local e servidor MCP para auditoria técnica, diagnóstico de SEO, Google Search Console, Blogger e conformidade com Google AdSense, operando sob a regra de custo de APIs R$ 0.

## Estrutura do Projeto

* `src/config.js`: Configurações centrais, limites e escopos das APIs.
* `src/auth/client.js`: Gerenciador de cliente OAuth com suporte a auto-refresh do token e persistência segura em `token.json`.
* `src/auth/oauth.js`: Servidor local para realização do fluxo de login OAuth 2.0.
* `src/auth/test-token.js`: Validador de conexão com as APIs do Google (Blogger, Search Console, AdSense, etc.).

## Como Executar

### 1. Instalar dependências
```bash
npm install
```

### 2. Autenticar com o Google
```bash
npm run auth
```

### 3. Testar a conexão e listar blogs
```bash
npm run test-token
```

