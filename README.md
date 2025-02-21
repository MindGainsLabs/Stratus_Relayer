# 🚀 Stratus Relayer Application

Bem-vindo ao **Stratus Relayer**, uma aplicação desenvolvida em **Node.js** que permite extrair e encaminhar mensagens do Discord para o Telegram de forma automática. Este guia fornecerá todas as etapas necessárias para que outra pessoa consiga implantar e executar esta aplicação em uma **VPS Ubuntu**.

---

## 📋 Sumário

1. [📌 Requisitos](#-requisitos)
2. [🔧 Configuração da VPS Ubuntu](#-configuração-da-vps-ubuntu)
3. [💻 Instalação das Ferramentas Necessárias](#-instalação-das-ferramentas-necessárias)
   - [1. Instalar Node.js](#1-instalar-nodejs)
   - [2. Instalar MongoDB](#2-instalar-mongodb)
   - [3. Instalar Git](#3-instalar-git)
4. [📥 Clonar o Repositório](#-clonar-o-repositório)
5. [⚙️ Configurar Variáveis de Ambiente](#-configurar-variáveis-de-ambiente)
   - [Criar e Configurar o Arquivo `.env`](#criar-e-configurar-o-arquivo-env)
6. [📦 Instalar Dependências](#-instalar-dependências)
   - [Instalar Dependências Node.js](#instalar-dependências-nodejs)
7. [🔐 Configuração dos Bots Discord e Telegram](#-configuração-dos-bots-discord-e-telegram)
   - [A. Configurar Bot no Discord](#a-configurar-bot-no-discord)
   - [B. Configurar Bot no Telegram](#b-configurar-bot-no-telegram)
8. [🚀 Executar a Aplicação](#-executar-a-aplicação)
9. [🔄 Configurar a Aplicação para Iniciar Automaticamente](#-configurar-a-aplicação-para-iniciar-automaticamente)
   - [Usando o PM2](#usando-o-pm2)
10. [🛡️ Configurar Firewall](#-configurar-firewall)
11. [✅ Testar a Implantação](#-testar-a-implantação)
12. [📝 Manutenção e Dicas Adicionais](#-manutenção-e-dicas-adicionais)
13. [📚 Recursos Adicionais](#-recursos-adicionais)
14. [🔗 Links Úteis](#-links-úteis)
15. [📜 Descrição](#-descrição)
16. [🛠️ Tecnologias Utilizadas](#%EF%B8%8F-tecnologias-utilizadas)
17. [📋 Funcionalidades](#-funcionalidades)
18. [📜 Responsabilidades](#-responsabilidades)
19. [📂 Estrutura do Projeto](#-estrutura-do-projeto)
20. [🔗 Integrações](#-integrações)

---

## 📌 Requisitos

Antes de iniciar, certifique-se de que você possui:

- **Acesso a uma VPS Ubuntu** com privilégios administrativos.
- **Conta no Discord** e **Bot Token**.
- **Conta no Telegram** e **Bot Token**.
- **Conhecimento básico** em linha de comando e configuração de serviços no Linux.

---

## 🔧 Configuração da VPS Ubuntu

### 1. Acesso à VPS

- **SSH (Secure Shell):**
  - Use o **SSH** para acessar sua VPS.
  - Abra o terminal no seu computador local e insira o comando:
    ```bash
    ssh usuario@ip_da_vps
    ```
  - Substitua `usuario` pelo seu nome de usuário na VPS e `ip_da_vps` pelo endereço IP da VPS.

### 2. Atualização do Sistema

- **Atualize o Ubuntu:**
  - Execute os seguintes comandos para atualizar os pacotes do sistema:
    ```bash
    sudo apt update
    sudo apt upgrade -y
    ```

---

## 💻 Instalação das Ferramentas Necessárias

### 1. Instalar Node.js

1. **Adicionar o Repositório NodeSource:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   ```

2. **Instalar Node.js:**
   ```bash
   sudo apt install -y nodejs
   ```

3. **Verificar Instalação:**
   ```bash
   node -v
   npm -v
   ```

### 2. Instalar MongoDB

1. **Importar a Chave Pública do MongoDB:**
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
   ```

2. **Criar o Arquivo de Lista do MongoDB:**
   ```bash
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
   ```

3. **Atualizar os Pacotes do Sistema:**
   ```bash
   sudo apt update
   ```

4. **Instalar o MongoDB:**
   ```bash
   sudo apt install -y mongodb-org
   ```

5. **Iniciar o MongoDB:**
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

6. **Verificar Instalação:**
   ```bash
   mongo --version
   ```

### 3. Instalar Git

1. **Instalar Git:**
   ```bash
   sudo apt install -y git
   ```

2. **Verificar Instalação:**
   ```bash
   git --version
   ```

---

## 📥 Clonar o Repositório

1. **Navegar até o Diretório Desejado:**
   ```bash
   cd /caminho/para/diretorio
   ```

2. **Clonar o Repositório:**
   ```bash
   git clone https://github.com/usuario/repo-Stratus_Relayer.git
   cd repo-Stratus_Relayer/Relay_Stratus
   ```

---

## ⚙️ Configurar Variáveis de Ambiente

### Criar e Configurar o Arquivo `.env`

1. **Criar o Arquivo `.env`:**
   ```bash
   nano .env
   ```

2. **Adicionar as Variáveis ao `.env`:**
   ```env
   # MongoDB Configuration
   MONGO_URI=mongodb://localhost:27017/scrapping-tweets-smarteye

   # Discord API Credentials
   TOKEN_DISCORD=seu_token_discord
   CHANNEL_ID=123456789012345678

   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=seu_telegram_bot_token
   TELEGRAM_CHAT_ID=987654321

   # Cron Job Configuration
   CRON_SCHEDULE=*/2 * * * * *
   CRON_HOURS=6

   # Servidor
   PORT=80
   ```

   **Descrição das Variáveis:**

   - **MONGO_URI:** URI de conexão com o MongoDB.
   - **TOKEN_DISCORD:** Token do seu bot Discord.
   - **CHANNEL_ID:** ID do canal Discord de onde as mensagens serão extraídas.
   - **TELEGRAM_BOT_TOKEN:** Token do seu bot Telegram.
   - **TELEGRAM_CHAT_ID:** ID do chat Telegram para onde as mensagens serão enviadas.
   - **CRON_SCHEDULE:** Expressão cron para agendamento da coleta de mensagens (por padrão, a cada 30 segundos).
   - **CRON_HOURS:** Número de horas para retroceder ao coletar mensagens.
   - **PORT:** Porta onde o servidor Node.js irá rodar (80 para HTTP padrão).

   **Exemplo Completo de `.env`:**
   ```env
   # MongoDB Configuration
   MONGO_URI=mongodb://localhost:27017/scrapping-tweets-smarteye

   # Discord API Credentials
   TOKEN_DISCORD=ODk5MDM3NjA1NTkzOTYw.YGmGgQ.QjzU9OgZrD4zm0YQ0i3mfxqwHSE
   CHANNEL_ID=123456789012345678

   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890
   TELEGRAM_CHAT_ID=987654321

   # Cron Job Configuration
   CRON_SCHEDULE=*/2 * * * * *
   CRON_HOURS=6

   # Servidor
   PORT=80
   ```

   **Notas:**

   - **Segurança:** Garanta que este arquivo `.env` **não seja compartilhado** ou versionado no controle de versão público, pois contém credenciais sensíveis.
   - **Formatação:** Certifique-se de que não haja espaços adicionais e que os valores estejam corretos.

---

## 📦 Instalar Dependências

### Instalar Dependências Node.js

1. **Navegar até o Diretório Node.js:**
   ```bash
   cd /caminho/para/repo-Stratus_Relayer/Relay_Stratus
   ```

2. **Instalar Dependências:**
   ```bash
   npm install
   ```
   
   **Nota:**
   - Certifique-se de que o arquivo `package.json` está corretamente configurado com todas as dependências necessárias.

3. **Verificar Dependências Instaladas:**
   - Após a instalação, uma pasta `node_modules` deve existir dentro de Relay_Stratus.

---

## 🔐 Configuração dos Bots Discord e Telegram

### A. Configurar Bot no Discord

1. **Criar um Bot no Discord:**
   - Acesse o [Discord Developer Portal](https://discord.com/developers/applications).
   - Clique em **"New Application"** e dê um nome para o seu aplicativo.
   
2. **Obter o Token do Bot:**
   - No menu lateral, vá para **"Bot"**.
   - Clique em **"Add Bot"** e confirme.
   - Em **"TOKEN"**, clique em **"Copy"** para obter o Token do Bot. **Guarde-o com segurança**.

3. **Convidar o Bot para seu Servidor:**
   - Ainda no Developer Portal, vá para **"OAuth2"** > **"URL Generator"**.
   - Em **"Scopes"**, selecione **"bot"**.
   - Em **"Bot Permissions"**, selecione as permissões necessárias (por exemplo, **"Read Messages"**, **"Send Messages"**, etc.).
   - Copie a URL gerada e abra-a no navegador para convidar o bot ao seu servidor.

4. **Obter o ID do Canal Discord:**
   - No Discord, ative o **"Modo de Desenvolvedor"** em **Configurações** > **Avançado** > **Modo de Desenvolvedor**.
   - Clique com o botão direito no canal desejado e selecione **"Copiar ID"** para obter o `CHANNEL_ID`.

### B. Configurar Bot no Telegram

1. **Criar um Bot no Telegram:**
   - Abra o Telegram e inicie uma conversa com o [BotFather](https://t.me/BotFather).
   - Envie o comando `/newbot` e siga as instruções para criar um novo bot.
   - Após a criação, o BotFather fornecerá um **Token de API** para o bot. **Guarde-o com segurança**.

2. **Obter o Chat ID do Telegram:**
   - Inicie uma conversa com o seu bot Telegram.
   - Envie uma mensagem qualquer.
   - Para obter o `TELEGRAM_CHAT_ID`, você pode usar a API do Telegram ou ferramentas como [Get IDs](https://getids.xyz/):

     - Abra a URL:
       ```
       https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
       ```
       Substitua `<YOUR_BOT_TOKEN>` pelo token do seu bot.
     - Encontre o `chat.id` na resposta JSON.

---

## 🚀 Executar a Aplicação

1. **Navegar até o Diretório Node.js:**
   ```bash
   cd /caminho/para/repo-Stratus_Relayer/Relay_Stratus
   ```

2. **Iniciar a Aplicação:**
   ```bash
   npm run start
   ```
   
   - **Alternativamente**, execute diretamente com Node.js:
     ```bash
     node index.js
     ```

   - **Saída Esperada:**
     ```
     Conectado ao MongoDB
     Cron job agendado com a seguinte expressão: "*/2 * * * * *"
     Servidor rodando em http://localhost:80
     ```

3. **Acessar a Interface Web:**
   - Abra um navegador e vá para `http://<IP_DA_SUA_VPS>`.
   - A página **"Extrator de Mensagens Discord"** deve ser exibida.

---

## 🔄 Configurar a Aplicação para Iniciar Automaticamente

### Usando o PM2

O **PM2** permite executar aplicações Node.js como serviços no Linux, garantindo que a aplicação inicie automaticamente com o sistema.

1. **Instalar o PM2:**
   ```bash
   sudo npm install -g pm2
   ```

2. **Iniciar a Aplicação com o PM2:**
   ```bash
   pm2 start index.js --name Stratus_Relayer
   ```

3. **Configurar o PM2 para Iniciar na Inicialização do Sistema:**
   ```bash
   pm2 startup systemd
   ```

4. **Salvar o Estado Atual do PM2:**
   ```bash
   pm2 save
   ```

5. **Verificar o Status do PM2:**
   ```bash
   pm2 status
   ```

---

## 🛡️ Configurar Firewall

Para que a aplicação seja acessível externamente, é necessário garantir que as portas utilizadas estejam abertas.

### Passo a Passo

1. **Abrir Porta no Firewall do Ubuntu:**

   - **Usar UFW (Uncomplicated Firewall):**
     ```bash
     sudo ufw allow 80/tcp
     sudo ufw enable
     sudo ufw status
     ```

2. **Verificar a Conexão:**

   - Acesse `http://<IP_DA_SUA_VPS>:80` no navegador para verificar se o servidor está rodando.
   - **Substitua** `<IP_DA_SUA_VPS>` pelo endereço IP da sua VPS.

---

## ✅ Testar a Implantação

Após configurar e iniciar a aplicação, você pode testar a implantação verificando se as mensagens estão sendo extraídas corretamente dos canais do Discord e se as notificações estão sendo enviadas para o Telegram. Verifique os logs da aplicação para garantir que não há erros e que todas as funcionalidades estão operando conforme esperado.

---

## 📝 Manutenção e Dicas Adicionais

- **Atualizações de Dependências**: Mantenha as dependências do projeto atualizadas para garantir a segurança e a estabilidade da aplicação.
- **Monitoramento**: Implemente monitoramento e alertas para acompanhar a saúde da aplicação e detectar problemas rapidamente.
- **Backups**: Realize backups regulares do banco de dados para evitar perda de dados.

---

## 📚 Recursos Adicionais

- **Documentação do Discord API**: [Discord Developer Portal](https://discord.com/developers/docs/intro)
- **Documentação do Rugcheck API**: [Rugcheck API Documentation](https://api.rugcheck.xyz/docs)
- **Documentação do Telegram API**: [Telegram Bot API](https://core.telegram.org/bots/api)

---

## 🔗 Links Úteis

- **Node.js**: [Node.js Official Website](https://nodejs.org/)
- **Express**: [Express Official Website](https://expressjs.com/)
- **Mongoose**: [Mongoose Official Website](https://mongoosejs.com/)
- **Axios**: [Axios GitHub Repository](https://github.com/axios/axios)
- **dotenv**: [dotenv GitHub Repository](https://github.com/motdotla/dotenv)
- **tweetnacl**: [tweetnacl GitHub Repository](https://github.com/dchest/tweetnacl-js)
- **tweetnacl-util**: [tweetnacl-util GitHub Repository](https://github.com/dchest/tweetnacl-util-js)

---

## 📜 Descrição

O Stratus Relayer Application é uma aplicação desenvolvida para extrair mensagens de canais do Discord e realizar análises e verificações utilizando diversas APIs e serviços. A aplicação é capaz de autenticar, buscar relatórios e enviar notificações para o Telegram.

---

## 🛠️ Tecnologias Utilizadas

- **Node.js**: Plataforma de desenvolvimento JavaScript.
- **Express**: Framework para construção de APIs.
- **Axios**: Cliente HTTP para realizar requisições.
- **Mongoose**: Biblioteca para modelagem de dados MongoDB.
- **dotenv**: Gerenciamento de variáveis de ambiente.
- **tweetnacl**: Biblioteca para criptografia e assinatura de mensagens.
- **tweetnacl-util**: Utilitários para codificação e decodificação de dados na biblioteca `tweetnacl`.

---

## 📋 Funcionalidades

- **Extração de Mensagens**: Extrai mensagens de canais do Discord em um período de tempo especificado.
- **Autenticação**: Autentica na API do Rugcheck para obter relatórios de tokens.
- **Análise de Tokens**: Busca relatórios de tokens utilizando a API do Rugcheck.
- **Notificações**: Envia notificações para o Telegram com as mensagens extraídas e analisadas.
- **Armazenamento**: Armazena mensagens extraídas no MongoDB.

---

## 📜 Responsabilidades

- **messageService.js**: Responsável por extrair mensagens dos canais do Discord e realizar análises.
- **rugcheckService.js**: Responsável por autenticar e buscar relatórios de tokens na API do Rugcheck.
- **telegramService.js**: Responsável por enviar notificações para o Telegram.
- **server.js**: Inicializa o servidor e configura as rotas da API.

---

## 📂 Estrutura do Projeto

```
/Relay_Stratus
├── public
│   ├── css
│   ├── js
│   └── index.html
├── src
│   ├── controllers
│   │   └── messageController.js
│   ├── models
│   │   └── Message.js
│   ├── routes
│   │   └── messageRoutes.js
│   ├── services
│   │   ├── messageService.js
│   │   ├── rugcheckService.js
│   │   └── telegramService.js
│   ├── utils
│   │   └── formatter.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## 🔗 Integrações

- **Discord API**: Utilizada para extrair mensagens dos canais do Discord.
- **Rugcheck API**: Utilizada para autenticar e buscar relatórios de tokens.
- **Telegram API**: Utilizada para enviar notificações com as mensagens extraídas e analisadas.

## Dependências

- **axios**: ^0.21.1
- **dotenv**: ^8.2.0
- **express**: ^4.17.1
- **mongoose**: ^5.10.9
- **tweetnacl**: ^1.0.3
- **tweetnacl-util**: ^0.15.1

## Configuração

1. Clone o repositório:
    ```bash
    git clone https://github.com/seu-usuario/scrapping-tweets-smarteye.git
    cd scrapping-tweets-smarteye/Relay_Stratus
    ```

2. Instale as dependências:
    ```bash
    npm install
    ```

3. Configure as variáveis de ambiente no arquivo env`.`:
    ```env
    TOKEN_DISCORD=SeuTokenDiscordAqui
    RUGCHECK_API_URL=https://api.rugcheck.xyz
    RUGCHECK_TOKEN_ID=SuaChavePublicaAqui
    RUGCHECK_SECRET_KEY=SuaChavePrivadaAqui
    TELEGRAM_BOT_TOKEN=SeuTokenTelegramBotAqui
    TELEGRAM_CHAT_ID=SeuChatIdTelegramAqui
    MONGODB_URI=SuaURIConexaoMongoDBAqui
    CHANNEL_ID_1=IDDoCanal1
    CHANNEL_ID_2=IDDoCanal2
    CHANNEL_ID_3=IDDoCanal3
    ```

4. Inicie a aplicação:
    ```bash
    npm start
    ```

## Uso

A aplicação irá extrair mensagens dos canais do Discord configurados, analisar os tokens mencionados nas mensagens utilizando a API do Rugcheck, e enviar notificações para o Telegram com os resultados das análises.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.