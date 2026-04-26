export const runtime = 'edge';

export async function GET() {
  const key = process.env.OPENROUTER_API_KEY;
  
  return new Response(
    JSON.stringify({
      key_exists: !!key,
      key_prefix: key ? key.substring(0, 20) : 'NONE',
      key_length: key?.length || 0,
      all_env: Object.keys(process.env).filter(k => !k.includes('SECRET')),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
