import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { verifyAuth } from '@/lib/auth';
import { assertAiIdentifyAllowed, recordAiUsage } from '@/lib/ai-gate';
import { addRateLimitHeaders, checkRateLimit, AI_LIMIT } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Species identification pipeline.
 * The browser posts the photo here; the OpenAI key never leaves the server.
 * The model returns JSON (common name, scientific name, confidence). Usage is
 * recorded only after a successful completion so a failed call does not spend the free quota.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const gate = await assertAiIdentifyAllowed(auth.userId);
    if (!gate.ok) {
      return gate.response;
    }

    const rateLimit = checkRateLimit(auth.userId, AI_LIMIT);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${imageFile.type || 'image/jpeg'};base64,${base64Image}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a fish species identifier. Output JSON with the following structure: { "common_name": "Common Name (how people call it, e.g., Rainbow Trout)", "scientific_name": "Scientific Name (e.g., Oncorhynchus mykiss)", "confidence": 0.95, "description": "Short description" }. Always provide both the common name (what people call it) and the scientific name (binomial nomenclature). If you cannot identify the fish, set both to null.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Identify the fish in this image. Return both the common name (what people call it) and the scientific name (binomial nomenclature).',
            },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No response from OpenAI' }, { status: 500 });
    }

    await recordAiUsage(auth.userId);

    const result = JSON.parse(content);
    const jsonResponse = NextResponse.json({
      species: result.common_name || result.species || null,
      scientificName: result.scientific_name || result.species || null,
      confidence: result.confidence || null,
      description: result.description || null,
    });

    return addRateLimitHeaders(jsonResponse, rateLimit);
  } catch (error: unknown) {
    console.error('OpenAI identification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
