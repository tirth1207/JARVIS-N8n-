import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { message } = await req.json();

  const webhookURL = "https://knowing-allowed-cheetah.ngrok-free.app/webhook/65bdf9c7-2412-4669-a9c9-7510350d50fc";

  try {
    const n8nRes = await fetch(webhookURL, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: message }),
    });

    const data = await n8nRes.json();
    console.log(`✅ Webhook response: ${data.output}`);
    return NextResponse.json({ response: data.output });
  } catch (error) {
    console.error('❌ Error talking to n8n:', error);
    return NextResponse.json({ response: 'Error talking to n8n' }, { status: 500 });
  }
}
