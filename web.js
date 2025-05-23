const express = require('express');
const { Nitro } = require('./app');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Token check cache
const tokenCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Token management (tokens.json)
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

function readTokens() {
    try {
        if (!fs.existsSync(TOKENS_FILE)) return [];
        return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

function writeTokens(tokens) {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

async function checkTokenStatus(token) {
    try {
        const headers = {
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US",
            "authorization": token,
            "referer": "https://discord.com/channels/@me",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9007 Chrome/91.0.4472.164 Electron/13.6.6 Safari/537.36",
            "x-debug-options": "bugReporterEnabled",
            "x-discord-locale": "en-US",
            "x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfdmVyc2lvbiI6IjEuMC45MDA3Iiwib3NfdmVyc2lvbiI6IjEwLjAuMTkwNDMiLCJvc19hcmNoIjoieDY0Iiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiY2xpZW50X2J1aWxkX251bWJlciI6MTYxODQyLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ=="
        };

        // Check token validity and get user info
        const [userResponse, boostResponse, guildsResponse] = await Promise.all([
            axios.get('https://discord.com/api/v9/users/@me', { headers }),
            axios.get('https://discord.com/api/v9/users/@me/guilds/premium/subscription-slots', { headers }),
            axios.get('https://discord.com/api/v9/users/@me/guilds', { headers })
        ]);

        const userData = userResponse.data;
        const boostData = boostResponse.data;
        const userGuilds = guildsResponse.data;

        // Get all guilds with premium status
        const premiumGuilds = userGuilds.filter(guild => guild.premium_subscription_count > 0);
        
        const boostedServers = [];
        const boostMap = new Map();

        // Map all boost slots (NEW: use premium_guild_subscription)
        for (const boost of boostData) {
            if (boost.premium_guild_subscription && !boost.premium_guild_subscription.ended) {
                const guildId = boost.premium_guild_subscription.guild_id;
                boostMap.set(guildId, {
                    cooldown: boost.cooldown_ends_at,
                    subscriptionId: boost.id,
                    premiumType: 2, // You can adjust this if you want to distinguish types
                    status: boost.cooldown_ends_at ? 'cooldown' : 'active'
                });
            }
        }

        // Show all boosted servers, even if user is not a member
        for (const [guildId, boostInfo] of boostMap.entries()) {
            try {
                const guildResponse = await axios.get(
                    `https://discord.com/api/v9/guilds/${guildId}`,
                    { headers }
                );
                const guildData = guildResponse.data;
                boostedServers.push({
                    id: guildId,
                    name: guildData.name,
                    icon: guildData.icon,
                    boostCount: 1,
                    status: boostInfo.status,
                    premiumType: boostInfo.premiumType,
                    cooldownEnds: boostInfo.cooldown,
                    premiumSubscriptionCount: 1
                });
            } catch (error) {
                // If guild info can't be fetched, show minimal info
                boostedServers.push({
                    id: guildId,
                    name: `Unknown Guild (${guildId})`,
                    icon: null,
                    boostCount: 1,
                    status: boostInfo.status,
                    premiumType: boostInfo.premiumType,
                    cooldownEnds: boostInfo.cooldown,
                    premiumSubscriptionCount: 1
                });
            }
        }

        return {
            valid: true,
            id: userData.id,
            username: userData.username,
            discriminator: userData.discriminator,
            avatar: userData.avatar,
            boostedServers,
            nitroStatus: boostData.length > 0 ? 'active' : 'none',
            boostCount: boostData.length,
            totalBoosts: boostedServers.reduce((sum, server) => sum + server.boostCount, 0)
        };
    } catch (error) {
        console.error('Token check error:', error.response?.data || error.message);
        return {
            valid: false,
            error: error.response?.status === 401 ? 'Invalid token' : 'Error checking token'
        };
    }
}

// Routes
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Discord Nitro Booster',
        description: 'Boost your Discord server with Nitro tokens'
    });
});

app.post('/check-tokens', async (req, res) => {
    const { tokens } = req.body;
    if (!tokens) {
        return res.status(400).json({ error: 'No tokens provided' });
    }

    const tokenList = tokens.split('\n').filter(token => token.trim());
    const results = [];

    for (const token of tokenList) {
        const trimmedToken = token.trim();
        
        // Check cache first
        if (tokenCache.has(trimmedToken)) {
            const cachedData = tokenCache.get(trimmedToken);
            if (Date.now() - cachedData.timestamp < CACHE_DURATION) {
                results.push(cachedData.data);
                continue;
            }
        }

        const status = await checkTokenStatus(trimmedToken);
        
        // Cache the result
        tokenCache.set(trimmedToken, {
            data: status,
            timestamp: Date.now()
        });

        results.push(status);
    }

    res.json({ results });
});

app.post('/boost', async (req, res) => {
    const { guildId, tokens } = req.body;
    
    if (!guildId || !tokens) {
        return res.status(400).json({ error: 'Missing guild ID or tokens' });
    }

    // Save tokens to file
    fs.writeFileSync('tokens.txt', tokens.split('\n').join('\n'));

    const results = [];
    const tokenList = tokens.split('\n').filter(token => token.trim());

    for (const token of tokenList) {
        const nitro = new Nitro(token.trim());
        try {
            if (await nitro.hasNitro()) {
                await nitro.boostServer(guildId);
                results.push({
                    token: token.slice(0, 25) + '...',
                    status: 'success',
                    message: 'Boosted successfully'
                });
            } else {
                results.push({
                    token: token.slice(0, 25) + '...',
                    status: 'error',
                    message: 'No Nitro found or invalid token'
                });
            }
        } catch (error) {
            results.push({
                token: token.slice(0, 25) + '...',
                status: 'error',
                message: error.message
            });
        }
    }

    res.json({ results });
});

// List all tokens
app.get('/tokens', (req, res) => {
    res.json({ tokens: readTokens() });
});

// Add a new token
app.post('/tokens', async (req, res) => {
    const { value } = req.body;
    if (!value) return res.status(400).json({ error: 'Token value required' });
    const tokens = readTokens();
    if (tokens.some(t => t.value === value)) {
        return res.status(400).json({ error: 'Bu token zaten ekli!' });
    }
    const id = Date.now().toString();
    let label = '', avatar = '', nitro = false;
    try {
        const userRes = await axios.get('https://discord.com/api/v9/users/@me', {
            headers: { authorization: value }
        });
        const user = userRes.data;
        label = `${user.username}#${user.discriminator}`;
        avatar = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}${user.avatar.startsWith('a_') ? '.gif' : '.png'}` : 'https://cdn.discordapp.com/embed/avatars/0.png';
        nitro = user.premium_type === 1 || user.premium_type === 2;
    } catch (e) {
        label = 'Unknown';
        avatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
        nitro = false;
    }
    tokens.push({ id, value, label, avatar, nitro });
    writeTokens(tokens);
    res.json({ success: true, id, label, avatar, nitro });
});

// Delete a token
app.delete('/tokens/:id', (req, res) => {
    const { id } = req.params;
    let tokens = readTokens();
    tokens = tokens.filter(t => t.id !== id);
    writeTokens(tokens);
    res.json({ success: true });
});

// Update a token
app.put('/tokens/:id', (req, res) => {
    const { id } = req.params;
    const { value, label } = req.body;
    let tokens = readTokens();
    const idx = tokens.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Token not found' });
    if (value) tokens[idx].value = value;
    if (label !== undefined) tokens[idx].label = label;
    writeTokens(tokens);
    res.json({ success: true });
});

// Start server
app.listen(port, () => {
    console.log(`Web panel running at http://localhost:${port}`);
}); 