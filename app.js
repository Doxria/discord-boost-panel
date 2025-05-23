const fs = require('fs');
const axios = require('axios');
const readline = require('readline');

class Nitro {
    constructor(token) {
        this.token = token;
        this.headers = {
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US",
            "authorization": token,
            "referer": "https://discord.com/channels/@me",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9007 Chrome/91.0.4472.164 Electron/13.6.6 Safari/537.36",
            "x-debug-options": "bugReporterEnabled",
            "x-discord-locale": "en-US",
            "x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfdmVyc2lvbiI6IjEuMC45MDA3Iiwib3NfdmVyc2lvbiI6IjEwLjAuMTkwNDMiLCJvc19hcmNoIjoieDY0Iiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiY2xpZW50X2J1aWxkX251bWJlciI6MTYxODQyLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ=="
        };
        this.subIds = [];
    }

    removeTokenFromTxt() {
        const tokens = fs.readFileSync('tokens.txt', 'utf8').split('\n');
        const filteredTokens = tokens.filter(token => token.trim() !== this.token);
        fs.writeFileSync('tokens.txt', filteredTokens.join('\n'));
    }

    async hasNitro() {
        try {
            const response = await axios.get('https://discord.com/api/v9/users/@me/guilds/premium/subscription-slots', { headers: this.headers });

            if (response.status === 200) {
                const subscriptions = response.data;
                this.subIds = subscriptions.map(sub => sub.id);
                if (this.subIds.length === 0) {
                    this.log('TOKEN HAS NO NITRO');
                    this.removeTokenFromTxt();
                    return false;
                }
                
                this.log('TOKEN NITRATED.');
                return true;
            }
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                this.log('YOUR TOKEN IS INCORRECT');
            } else {
                this.log(`Error: ${error.message}`);
                console.error(error.response?.data);
            }
            this.removeTokenFromTxt();
            return false;
        }
    }

    async boostServer(guildId) {
        for (let i = 0; i < this.subIds.length; i++) {
            try {
                const response = await axios.put(`https://discord.com/api/v9/guilds/${guildId}/premium/subscriptions`, {
                        user_premium_guild_subscription_slot_ids: [this.subIds[i]]
                    },
                    {
                        headers: {
                            ...this.headers,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.status === 201) {
                    this.log(`Boosted ${i + 1} of ${this.subIds.length} from ${this.token.slice(25)}`);
                } else if (response.status === 400) {
                    this.log(`BOOST RELEASED ${i + 1} of ${this.subIds.length} from ${this.token.slice(25)}`);
                } else {
                    this.log(`ERROR: ${response.status}`);
                }
            } catch (error) {
                this.log(`Error boosting: ${error.message}`);
            }
        }
    }

    log(text) { console.log(text); }
}

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const guildId = await new Promise(resolve => {
        rl.question('SERVER ID: ', (answer) => { resolve(answer); });
    });

    try {
        const tokens = fs.readFileSync('tokens.txt', 'utf8').split('\n').filter(token => token.trim());
        
        for (const token of tokens) {
            const nitro = new Nitro(token.trim());
            if (await nitro.hasNitro()) { await nitro.boostServer(guildId); }
        }
    } catch (error) {
        console.error('Error reading tokens file:', error.message);
    }

    rl.question('BOOSTS ARE PRINTED', () => {
        rl.close();
    });
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { Nitro }; 