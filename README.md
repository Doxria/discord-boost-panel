# Discord Nitro Booster

A modern web application for managing and boosting Discord servers using Nitro tokens. Built with Node.js, Express, and a sleek Discord-inspired UI.

## Features

- 🎨 Modern Discord-inspired UI with dark theme
- 🔐 Secure token management system
- 👤 Token avatar display with status indicators
- 📊 Real-time token status checking
- 🚀 Bulk server boosting capabilities
- 🔄 Token cooldown tracking
- 💾 Persistent token storage
- 📱 Responsive design

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A modern web browser

## Installation

1. Clone the repository:
```bash
git clone https://github.com/doxria/discord-booster.git
cd discord-booster
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory and configure your environment variables:
```env
PORT=3000
# Add other environment variables as needed
```

4. Start the application:
```bash
node web.js
```

The application will be available at `http://localhost:3000`

## Usage

### Managing Tokens

1. **Adding Tokens**
   - Click the "+" button in the left sidebar
   - Enter your Discord token in the modal
   - Click "Save" to store the token

2. **Editing/Deleting Tokens**
   - Right-click on any token avatar in the sidebar
   - Choose to edit or delete the token
   - Confirm your action

### Boosting Servers

1. Enter the target server ID in the "Server ID" field
2. Select tokens from the sidebar or paste them directly into the "Tokens" textarea
3. Click "Start Boosting" to begin the process
4. Monitor the status of each token in real-time

### Token Status Panel

The right panel displays detailed information about each token:
- Token validity
- Nitro status
- Active boosts
- Boosted servers
- Cooldown information

## Security Considerations

- Tokens are stored securely on your local machine
- No tokens are sent to external servers except Discord's API
- Use this tool responsibly and in accordance with Discord's Terms of Service

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This tool is provided for educational purposes only. Users are responsible for ensuring their use of this tool complies with Discord's Terms of Service. The developers are not responsible for any misuse or violations of Discord's policies.

## Support

If you encounter any issues or have questions, please open an issue in the GitHub repository. 
