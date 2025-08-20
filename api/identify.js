// api/identify.js
import axios from 'axios';

export default async function handler(req, res) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const ipinfoRes = await axios.get(`https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_TOKEN}`);
    const org = ipinfoRes.data.org || '';
    const hostname = ipinfoRes.data.hostname || '';

    if (!org || org.toLowerCase().includes('isp')) {
      return res.status(200).json({ message: 'Visitor is anonymous or ISP user', ipinfo: ipinfoRes.data });
    }

    const domain = hostname || (org.split(' ').slice(1).join('').toLowerCase() + '.com');

    const hunterRes = await axios.get(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}`);

    res.status(200).json({
      ipinfo: ipinfoRes.data,
      hunter: hunterRes.data.data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
