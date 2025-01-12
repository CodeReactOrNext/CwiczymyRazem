import { NextApiRequest, NextApiResponse } from 'next';
import { sendDiscordMessage } from 'utils/firebase/client/discord.utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { message } = req.body;

  try {
    await sendDiscordMessage({
      content: message,
      username: 'CwiczymyRazem Bot'
    });
    
    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
}