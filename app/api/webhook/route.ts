import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { message } = await req.json();

  const webhookURL = "https://knowing-allowed-cheetah.ngrok-free.app/webhook/f3c37cd3-bd6c-4440-b2f3-b83a8629591a";

  try {
    const n8nRes = await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await n8nRes.json();
    console.log(`✅ Webhook response: ${data.output}`);
    return NextResponse.json({ response: data.output });
  } catch (error) {
    console.error('❌ Error talking to n8n:', error);
    return NextResponse.json({ response: 'Error talking to n8n' }, { status: 500 });
  }
}
