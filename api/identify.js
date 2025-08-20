import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ipinfoRes = await axios.get(`https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_TOKEN}`);
    const org = ipinfoRes.data.org || '';
    const hostname = ipinfoRes.data.hostname || '';
    let hunterData = null;
    if (org && !org.toLowerCase().includes('isp')) {
      const domain = hostname || (org.split(' ').slice(1).join('').toLowerCase() + '.com');
      const hunterRes = await axios.get(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}`);
      hunterData = hunterRes.data.data;
    }
    const visitorData = {
      ipinfo: ipinfoRes.data,
      hunter: hunterData,
      timestamp: new Date().toISOString(),
    };
    await axios.post(process.env.N8N_WEBHOOK_URL, visitorData);

    return res.status(200).end(); // No sensitive info returned
  } catch (error) {
    return res.status(500).end();
  }
}
