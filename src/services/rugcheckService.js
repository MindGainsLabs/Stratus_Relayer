import axios from 'axios';
import { configDotenv } from 'dotenv';
import nacl from 'tweetnacl';
import pkg from 'tweetnacl-util';
const { decodeUTF8, encodeBase64, decodeBase64 } = pkg;

configDotenv();

const API_URL = process.env.RUGCHECK_API_URL;

const loginToRugcheck = async () => {
    const message = {
        "message": "Sign-in to Rugcheck.xyz",
        "publicKey": process.env.RUGCHECK_TOKEN_ID,
        "timestamp": Date.now()
    };

    // Assinatura da mensagem
    const messageString = JSON.stringify(message);
    const messageUint8 = decodeUTF8(messageString);
    const secretKeyUint8 = decodeBase64(process.env.RUGCHECK_SECRET_KEY);
    const signatureUint8 = nacl.sign.detached(messageUint8, secretKeyUint8);
    const signatureBase64 = encodeBase64(signatureUint8);

    console.log('Message:', messageString);
    console.log('Message Uint8', messageUint8);
    console.log('Secret Key Uint8', secretKeyUint8);
    console.log('Signature Uint8', signatureUint8)
    console.log('Signature:', signatureBase64);

    const payload = {
        "message": message,
        "signature": {
            "data": Array.from(signatureUint8),
            "type": "ed25519"
        },
        "wallet": process.env.RUGCHECK_TOKEN_ID
    };

    try {
        const response = await axios.post(`https://api.rugcheck.xyz/auth/login/solana`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        if (response.status === 200) {
            console.log('Login successful:', response.data);
            return response.data.token;
        } else {
            console.error('Failed to login:', response.status, response.data);
            return null;
        }
    } catch (error) {
        console.error('Failed to login:', error);
        return null;
    }
};

const fetchDomains = async (authToken) => {
    try {
        const response = await axios.get(`${API_URL}/domains`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to fetch domains:', response.status, response.data);
            return null;
        }
    } catch (error) {
        console.error('Failed to fetch domains:', error);
        return null;
    }
};

const fetchDomainsCsv = async (authToken) => {
    try {
        const response = await axios.get(`${API_URL}/domains/data.csv`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            responseType: 'blob'
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to fetch domains CSV:', response.status, response.data);
            return null;
        }
    } catch (error) {
        console.error('Failed to fetch domains CSV:', error);
        return null;
    }
};

const fetchDomainLookup = async (authToken, id) => {
    console.log('fetchDomainLookup', id);
    try {
        const response = await axios.get(`${API_URL}/domains/lookup/${encodeURIComponent(id)}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`,
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to fetch domain lookup:', response.status, response.data);
            return null;
        }
    } catch (error) {
        console.error('Failed to fetch domain lookup:', error);
        return null;
    }
};

const fetchDomainRecords = async (authToken, id) => {
    try {
        const response = await axios.get(`${API_URL}/domains/records/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`,
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to fetch domain records:', response.status, response.data);
            return null;
        }
    } catch (error) {
        console.error('Failed to fetch domain records:', error);
        return null;
    }
};

const fetchLeaderboard = async (authToken) => {
    try {
        const response = await axios.get(`${API_URL}/leaderboard`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to fetch leaderboard:', response.status, response.data);
            return null;
        }
    } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        return null;
    }
};

const fetchMaintenance = async (authToken) => {
    try {
        const response = await axios.get(`${API_URL}/maintenance`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to fetch maintenance:', response.status, response.data);
            return null;
        }
    } catch (error) {
        console.error('Failed to fetch maintenance:', error);
        return null;
    }
};

const fetchPing = async (authToken) => {
    try {
        const response = await axios.get(`${API_URL}/ping`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to fetch ping:', response.status, response.data);
            return null;
        }
    } catch (error) {
        console.error('Failed to fetch ping:', error);
        return null;
    }
};

const fetchNewTokens = async (authToken) => {
    try {
        const response = await axios.get(`${API_URL}/stats/new_tokens`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to fetch new tokens:', response.status, response.data);
            return null;
        }
    }
    catch (error) {
        console.error('Failed to fetch new tokens:', error);
        return null;
    }
}

const fetchRecentTokens = async (authToken) => {
    try {
        const response = await axios.get(`${API_URL}/stats/recent`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to fetch recent tokens:', response.status, response.data);
            return null;
        }
    }
    catch (error) {
        console.error('Failed to fetch recent tokens:', error);
        return null;
    }
}

const fetchTrendingTokens = async (authToken) => {
    try {
        const response = await axios.get(`${API_URL}/stats/trending`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to fetch trending tokens:', response.status, response.data);
            return null;
        }
    }
    catch (error) {
        console.error('Failed to fetch trending tokens:', error);
        return null;
    }
}

const fetchVerifiedTokens = async (authToken) => {
    try {
        const response = await axios.get(`${API_URL}/stats/verified`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to fetch verified tokens:', response.status, response.data);
            return null;
        }
    }
    catch (error) {
        console.error('Failed to fetch verified tokens:', error);
        return null;
    }
}

const fetchTokenLockers = async (authToken, tokenId) => {
    try {
        const response = await axios.get(`${API_URL}/tokens/${tokenId}/lockers`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to fetch token lockers:', response.status, response.data);
            return null;
        }
    }
    catch (error) {
        console.error('Failed to fetch token lockers:', error);
        return null;
    }
}

const fetchTokenLockersFlux = async (authToken, tokenId) => {
    try {
        const response = await axios.get(`${API_URL}/tokens/${tokenId}/lockers/flux`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to fetch token lockers flux:', response.status, response.data);
            return null;
        }
    }
    catch (error) {
        console.error('Failed to fetch token lockers flux:', error);
        return null;
    }
}

const reportToken = async (authToken, tokenId) => {
    try {
        const response = await axios.get(`${API_URL}/tokens/${tokenId}/report`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to report token:', response.status, response.data);
            return null;
        }
    }
    catch (error) {
        console.error('Failed to report token:', error);
        return null;
    }
}

const voteOnToken = async (authToken, tokenId) => {
    try {
        const response = await axios.get(`${API_URL}/tokens/${tokenId}/votes`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to vote on token:', response.status, response.data);
            return null;
        }
    }
    catch (error) {
        console.error('Failed to vote on token:', error);
        return null;
    }
}

const getTokenReportSummary = async (authToken, tokenId) => {
    try {
        const response = await axios.get(`${API_URL}/tokens/${tokenId}/report/summary`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Failed to fetch token report summary:', response.status, response.data);
            return null;
        }
    }
    catch (error) {
        console.error('Failed to fetch token report summary:', error);
        return null;
    }
}

export {
    loginToRugcheck,
    fetchDomains,
    fetchDomainsCsv,
    fetchDomainLookup,
    fetchDomainRecords,
    fetchLeaderboard,
    fetchMaintenance,
    fetchPing,
    fetchNewTokens,
    fetchRecentTokens,
    fetchTrendingTokens,
    fetchVerifiedTokens,
    fetchTokenLockers,
    fetchTokenLockersFlux,
    reportToken,
    voteOnToken,
    getTokenReportSummary,
};