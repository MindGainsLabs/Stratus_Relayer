# 🚀 Stratus Relayer Application

Welcome to **Stratus Relayer**, an application developed in **Node.js** that allows you to extract and forward messages from Discord to Telegram automatically. This guide provides all the necessary steps to deploy and run this application on an **Ubuntu VPS**.

---

## 📋 Table of Contents

1. [📌 Requirements](#-requirements)
2. [🔧 Ubuntu VPS Setup](#-ubuntu-vps-setup)
3. [💻 Installing Necessary Tools](#-installing-necessary-tools)
   - [Install Node.js](#install-nodejs)
   - [Install MongoDB](#install-mongodb)
   - [Install Git](#install-git)
4. [📥 Clone the Repository](#-clone-the-repository)
5. [⚙️ Configure Environment Variables](#%EF%B8%8F-configure-environment-variables)
   - [Create and Configure the `.env` File](#create-and-configure-the-env-file)
6. [📦 Install Dependencies](#-install-dependencies)
   - [Install Node.js Dependencies](#install-nodejs-dependencies)
7. [🔐 Configure Discord and Telegram Bots](#-configure-discord-and-telegram-bots)
   - [Configure Discord Bot](#configure-discord-bot)
   - [Configure Telegram Bot](#configure-telegram-bot)
8. [🚀 Run the Application](#-run-the-application)
9. [🔄 Configure the Application for Automatic Startup](#-configure-the-application-to-start-automatically)
   - [Using PM2](#using-pm2)
10. [🛡️ Configure Firewall](#%EF%B8%8F-configure-firewall)
11. [✅ Test Deployment](#-test-deployment)
12. [📝 Maintenance and Additional Tips](#-maintenance-and-additional-tips)
13. [📚 Additional Resources](#-additional-resources)
14. [🔗 Useful Links](#-useful-links)
15. [📜 Description](#-description)
16. [🛠️ Technologies Used](#%EF%B8%8F-technologies-used)
17. [📋 Features](#-features)
18. [📜 Responsibilities](#-responsibilities)
19. [📂 Project Structure](#-project-structure)
20. [🔗 Integrations](#-integrations)
21. [📦 Dependencies](#-dependencies)
22. [⚙️ Configuration](#%EF%B8%8F-configuration)
23. [🚀 Usage](#-usage)
24. [📜 License](#-license)

---

## 📌 Requirements

Before starting, ensure you have:

- **Access to an Ubuntu VPS** with administrative privileges.
- **A Discord account** with a bot token.
- **A Telegram account** with a bot token.
- **Basic knowledge** of command-line usage and Linux service configuration.

---

## 🔧 Ubuntu VPS Setup

### 1. Access the VPS

- **Connect via SSH:**
  ```bash
  ssh user@vps_ip
  ```
  Replace `user` with your VPS username and `vps_ip` with the server’s IP address.

### 2. Update the System

- **Update Ubuntu packages:**
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

---

## 💻 Installing Necessary Tools

### Install Node.js

1. **Add the NodeSource Repository:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   ```
2. **Install Node.js:**
   ```bash
   sudo apt install -y nodejs
   ```
3. **Verify Installation:**
   ```bash
   node -v && npm -v
   ```

### Install MongoDB

1. **Import the MongoDB Public Key:**
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
   ```
2. **Create the MongoDB Repository List File:**
   ```bash
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
   ```
3. **Update Package List and Install MongoDB:**
   ```bash
   sudo apt update && sudo apt install -y mongodb-org
   ```
4. **Start and Enable MongoDB:**
   ```bash
   sudo systemctl start mongod && sudo systemctl enable mongod
   ```
5. **Verify Installation:**
   ```bash
   mongo --version
   ```

### Install Git

1. **Install Git:**
   ```bash
   sudo apt install -y git
   ```
2. **Verify Installation:**
   ```bash
   git --version
   ```

---

## 📥 Clone the Repository

1. **Navigate to the Desired Directory:**
   ```bash
   cd /path/to/directory
   ```
2. **Clone the Repository:**
   ```bash
   git clone https://github.com/user/repo-Stratus_Relayer.git
   cd repo-Stratus_Relayer/Relay_Stratus
   ```

---

## ⚙️ Configure Environment Variables

### Create and Configure the `.env` File

1. **Create the `.env` File:**
   ```bash
   nano .env
   ```
2. **Add the Environment Variables:**
   ```env
   API_URL=
   TOKEN_DISCORD=
   CHANNEL_ID_1=
   CHANNEL_ID_2=
   CHANNEL_ID_3=
   TELEGRAM_TOKEN=
   TELEGRAM_CHAT_ID=
   PORT=
   MONGO_URI=
   RUGCHECK_API_URL=
   RUGCHECK_TOKEN_ID=
   MONGO_URI_TEST=
   ```

   **Security Notes:**
   - Ensure the `.env` file is **not shared** or committed to version control.
   - Double-check the formatting and correct values before running the application.

---

## 📦 Install Dependencies

### Install Node.js Dependencies

1. **Navigate to the Project Directory:**
   ```bash
   cd /path/to/repo-Stratus_Relayer/Relay_Stratus
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Verify Installation:**
   - Ensure the `node_modules` folder exists within `Relay_Stratus`.

---

## 🔐 Discord and Telegram Bot Setup

### A. Configure Bot on Discord

1. **Create a Bot on Discord:**
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications).
   - Click **"New Application"** and name your application.
   
2. **Obtain the Bot Token:**
   - In the side menu, go to **"Bot"**.
   - Click **"Add Bot"** and confirm.
   - Under **"TOKEN"**, click **"Copy"** to obtain the Bot Token. **Keep it secure**.

3. **Invite the Bot to Your Server:**
   - Still in the Developer Portal, go to **"OAuth2"** > **"URL Generator"**.
   - In **"Scopes"**, select **"bot"**.
   - In **"Bot Permissions"**, select the necessary permissions (e.g., **"Read Messages"**, **"Send Messages"**, etc.).
   - Copy the generated URL and open it in a browser to invite the bot to your server.

4. **Obtain the Discord Channel ID:**
   - In Discord, enable **"Developer Mode"** in **Settings** > **Advanced** > **Developer Mode**.
   - Right-click the desired channel and select **"Copy ID"** to obtain the `CHANNEL_ID`.

### B. Configure Bot on Telegram

1. **Create a Bot on Telegram:**
   - Open Telegram and start a chat with [BotFather](https://t.me/BotFather).
   - Send the command `/newbot` and follow the instructions to create a new bot.
   - After creation, BotFather will provide an **API Token** for the bot. **Keep it secure**.

2. **Obtain the Telegram Chat ID:**
   - Start a conversation with your Telegram bot.
   - Send any message.
   - To obtain the `TELEGRAM_CHAT_ID`, use the Telegram API or tools like [Get IDs](https://getids.xyz/):

     - Open the URL:
       ```
       https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
       ```
       Replace `<YOUR_BOT_TOKEN>` with your bot's token.
     - Find the `chat.id` in the JSON response.

---

## 🚀 Run the Application

1. **Navigate to the Node.js Directory:**
   ```bash
   cd /path/to/repo-Stratus_Relayer/Relay_Stratus
   ```

2. **Start the Application:**
   ```bash
   npm run start
   ```
   
   - **Alternatively**, run directly with Node.js:
     ```bash
     node index.js
     ```

   - **Expected Output:**
     ```
     Connected to MongoDB
     Cron job scheduled with the following expression: "*/2 * * * * *"
     Server running at http://localhost:80
     ```

3. **Access the Web Interface:**
   - Open a browser and go to `http://<YOUR_VPS_IP>`.
   - The **"Discord Message Extractor"** page should be displayed.

---

## 🔄 Configure the Application for Automatic Startup

### Using PM2

**PM2** allows Node.js applications to run as services on Linux, ensuring that the application starts automatically with the system.

1. **Install PM2:**
   ```bash
   sudo npm install -g pm2
   ```

2. **Start the Application with PM2:**
   ```bash
   pm2 start index.js --name Stratus_Relayer
   ```

3. **Set PM2 to Start on System Boot:**
   ```bash
   pm2 startup systemd
   ```

4. **Save the Current PM2 State:**
   ```bash
   pm2 save
   ```

5. **Check PM2 Status:**
   ```bash
   pm2 status
   ```

---

## 🛡️ Configure Firewall

To ensure the application is accessible externally, make sure the necessary ports are open.

### Step-by-Step

1. **Open the Port on Ubuntu Firewall:**

   - **Use UFW (Uncomplicated Firewall):**
     ```bash
     sudo ufw allow 80/tcp
     sudo ufw enable
     sudo ufw status
     ```

2. **Check Connection:**

   - Access `http://<YOUR_VPS_IP>:80` in a browser to verify if the server is running.
   - **Replace** `<YOUR_VPS_IP>` with your VPS's IP address.

---

## ✅ Test Deployment

After configuring and starting the application, test the deployment by verifying if messages are being extracted correctly from Discord channels and if notifications are being sent to Telegram. Check the application logs to ensure there are no errors and that all functionalities are operating as expected.

---

## 📝 Maintenance and Additional Tips

- **Dependency Updates**: Keep project dependencies updated to ensure security and stability.
- **Monitoring**: Implement monitoring and alerts to track application health and detect issues quickly.
- **Backups**: Regularly back up the database to prevent data loss.

---

## 📚 Additional Resources

- **Discord API Documentation**: [Discord Developer Portal](https://discord.com/developers/docs/intro)
- **Rugcheck API Documentation**: [Rugcheck API Documentation](https://api.rugcheck.xyz/docs)
- **Telegram API Documentation**: [Telegram Bot API](https://core.telegram.org/bots/api)

---

## 🔗 Useful Links

- **Node.js**: [Node.js Official Website](https://nodejs.org/)
- **Express**: [Express Official Website](https://expressjs.com/)
- **Mongoose**: [Mongoose Official Website](https://mongoosejs.com/)
- **Axios**: [Axios GitHub Repository](https://github.com/axios/axios)
- **dotenv**: [dotenv GitHub Repository](https://github.com/motdotla/dotenv)
- **tweetnacl**: [tweetnacl GitHub Repository](https://github.com/dchest/tweetnacl-js)
- **tweetnacl-util**: [tweetnacl-util GitHub Repository](https://github.com/dchest/tweetnacl-util-js)

---

## 📜 Description

The Stratus Relayer Application is developed to extract messages from Discord channels and perform analysis and verification using various APIs and services. The application can authenticate, fetch reports, and send notifications to Telegram.

---

## 🛠️ Technologies Used

- **Node.js**: JavaScript development platform.
- **Express**: API development framework.
- **Axios**: HTTP client for making requests.
- **Mongoose**: MongoDB data modeling library.
- **dotenv**: Environment variable management.
- **tweetnacl**: Library for cryptography and message signing.
- **tweetnacl-util**: Utilities for encoding and decoding data in the `tweetnacl` library.

---

## 📋 Features

- **Message Extraction**: Extracts messages from Discord channels within a specified time frame.
- **Authentication**: Authenticates with the Rugcheck API to obtain token reports.
- **Token Analysis**: Fetches token reports using the Rugcheck API.
- **Notifications**: Sends notifications to Telegram with extracted and analyzed messages.
- **Storage**: Stores extracted messages in MongoDB.

---

## 📜 Responsibilities

- **messageService.js**: Responsible for extracting messages from Discord channels and performing analyses.
- **rugcheckService.js**: Responsible for authenticating and retrieving token reports from the Rugcheck API.
- **telegramService.js**: Responsible for sending notifications to Telegram.
- **server.js**: Initializes the server and configures API routes.

---

## 📂 Project Structure

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

## 🔗 Integrations

- **Discord API**: Used to extract messages from Discord channels.
- **Rugcheck API**: Used to authenticate and retrieve token reports.
- **Telegram API**: Used to send notifications with extracted and analyzed messages.

## 📦 Dependencies

- **axios**: ^0.21.1
- **dotenv**: ^8.2.0
- **express**: ^4.17.1
- **mongoose**: ^5.10.9
- **tweetnacl**: ^1.0.3
- **tweetnacl-util**: ^0.15.1

## ⚙️ Configuration

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/scrapping-tweets-smarteye.git
    cd scrapping-tweets-smarteye/Relay_Stratus
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Configure environment variables in the `.env` file:
    ```env
    API_URL=https://server.example.com
    TOKEN_DISCORD=YourDiscordTokenHere
    RUGCHECK_API_URL=https://api.rugcheck.xyz
    RUGCHECK_TOKEN_ID=YourPublicKeyHere
    RUGCHECK_SECRET_KEY=YourPrivateKeyHere
    TELEGRAM_BOT_TOKEN=YourTelegramBotTokenHere
    TELEGRAM_CHAT_ID=YourTelegramChatIdHere
    PORT=80
    MONGODB_URI=YourMongoDBConnectionURIHere
    CHANNEL_ID_1=ChannelID1
    CHANNEL_ID_2=ChannelID2
    CHANNEL_ID_3=ChannelID3
    ```

4. Start the application:
    ```bash
    npm start
    ```

## 🚀 Usage

The application will extract messages from configured Discord channels, analyze tokens mentioned in the messages using the Rugcheck API, and send notifications to Telegram with the analysis results.

## 📜 License

This project is licensed under the MIT license. See the LICENSE file for more details.