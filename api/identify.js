import axios from 'axios';

export default async function handler(req, res) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Get IPinfo data
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

    // POST to n8n webhook
    await axios.post(process.env.N8N_WEBHOOK_URL, visitorData);

    res.status(200).json({ status: 'sent to n8n', data: visitorData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
