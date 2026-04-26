import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const SESSION_TTL = 60 * 60 * 24 * 7;
const MAX_MEMORY = 24;

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export async function getSessionId(): Promise<string> {
  return crypto.randomUUID();
}

export async function loadMemory(sessionId: string): Promise<Message[]> {
  try {
    const data = await redis.get<string>(`ragna:${sessionId}`);
    if (!data) return [];
    const messages: Message[] = JSON.parse(data);
    return messages.slice(-MAX_MEMORY);
  } catch {
    return [];
  }
}

export async function saveMemory(sessionId: string, messages: Message[]): Promise<void> {
  try {
    const trimmed = messages.slice(-MAX_MEMORY);
    await redis.set(`ragna:${sessionId}`, JSON.stringify(trimmed), { ex: SESSION_TTL });
  } catch (err) {
    console.error('Redis save failed:', err);
  }
}

export async function appendMessage(sessionId: string, message: Message): Promise<void> {
  const history = await loadMemory(sessionId);
  history.push(message);
  await saveMemory(sessionId, history);
}
