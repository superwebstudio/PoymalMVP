import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const CLIENT_ID = process.env.FISHIAL_CLIENT_ID;
        const CLIENT_SECRET = process.env.FISHIAL_CLIENT_SECRET;

        if (!CLIENT_ID || !CLIENT_SECRET) {
            console.error('Fishial.AI credentials not configured');
            return NextResponse.json(
                {
                    error: 'Fishial.AI credentials not configured. Please set FISHIAL_CLIENT_ID and FISHIAL_CLIENT_SECRET in your environment variables.',
                    details: 'Get your credentials from https://portal.fishial.ai → Developer Portal → API Credentials'
                },
                { status: 500 }
            );
        }

        // Get the form data
        const formData = await request.formData();
        const imageFile = formData.get('image') as File;

        if (!imageFile) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        if (imageFile.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Image size exceeds 10MB limit' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!imageFile.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'File must be an image' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        console.log(`Image: ${imageFile.name || 'unnamed'}, Size: ${buffer.byteLength} bytes, Type: ${imageFile.type}`);

        // Step 1: Get bearer token
        const tokenRes = await fetch('https://api-users.fishial.ai/v1/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            }),
        });

        if (!tokenRes.ok) {
            const errorText = await tokenRes.text();
            console.error('Fishial.AI token error:', tokenRes.status, errorText);
            return NextResponse.json(
                {
                    error: 'Failed to authenticate with Fishial.AI',
                    details: 'Please check that FISHIAL_CLIENT_ID and FISHIAL_CLIENT_SECRET are correct'
                },
                { status: 401 }
            );
        }

        const tokenData = await tokenRes.json();
        const access_token = tokenData.access_token;

        if (!access_token) {
            console.error('No access_token in token response:', tokenData);
            return NextResponse.json(
                { error: 'Failed to get access token from Fishial.AI' },
                { status: 500 }
            );
        }

        console.log('Bearer token obtained successfully');

        // Step 2: Get signed upload URL
        const md5Hash = crypto.createHash('md5').update(buffer).digest('base64');

        const uploadRes = await fetch('https://api.fishial.ai/v1/recognition/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                blob: {
                    filename: imageFile.name || 'fish-image.jpg',
                    content_type: imageFile.type || 'image/jpeg',
                    byte_size: buffer.byteLength,
                    checksum: md5Hash,
                },
            }),
        });

        if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            console.error('Fishial.AI upload URL error:', uploadRes.status, errorText);
            return NextResponse.json(
                {
                    error: 'Failed to get upload URL from Fishial.AI',
                    details: errorText || 'Unknown error'
                },
                { status: uploadRes.status }
            );
        }

        const uploadJson = await uploadRes.json();
        console.log('Signed upload URL obtained, signed-id:', uploadJson['signed-id']);

        if (!uploadJson['direct-upload'] || !uploadJson['signed-id']) {
            console.error('Invalid upload response:', uploadJson);
            return NextResponse.json(
                { error: 'Invalid response from Fishial.AI upload endpoint' },
                { status: 500 }
            );
        }

        // Step 3: PUT the image to Google Cloud
        const directUpload = uploadJson['direct-upload'];
        const uploadUrl = directUpload.url;
        const uploadHeaders = directUpload.headers;

        // Only use specific headers for Google Cloud upload (Content-MD5 and Content-Disposition)
        // Don't include Content-Type as it can cause issues
        const gcsHeaders: Record<string, string> = {};
        if (uploadHeaders['Content-MD5']) {
            gcsHeaders['Content-MD5'] = uploadHeaders['Content-MD5'];
        }
        if (uploadHeaders['Content-Disposition']) {
            gcsHeaders['Content-Disposition'] = uploadHeaders['Content-Disposition'];
        }

        console.log('Uploading to Google Cloud:', uploadUrl);
        const uploadToGCS = await fetch(uploadUrl, {
            method: 'PUT',
            headers: gcsHeaders,
            body: buffer,
        });

        if (!uploadToGCS.ok) {
            const errorText = await uploadToGCS.text();
            console.error('Google Cloud upload error:', uploadToGCS.status, errorText);
            return NextResponse.json(
                { error: 'Failed to upload image to storage', details: errorText },
                { status: 500 }
            );
        }

        console.log('Image uploaded successfully to Google Cloud');

        // Step 4: Run recognition
        const signedId = uploadJson['signed-id'];
        const recognitionRes = await fetch(
            `https://api.fishial.ai/v1/recognition/image?q=${encodeURIComponent(signedId)}`,
            {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Accept': 'application/json',
                },
            }
        );

        if (!recognitionRes.ok) {
            const errorText = await recognitionRes.text();
            console.error('Fishial.AI recognition error:', recognitionRes.status, errorText);
            return NextResponse.json(
                {
                    error: 'Failed to recognize fish',
                    details: errorText || 'Unknown error'
                },
                { status: recognitionRes.status }
            );
        }

        console.log('Recognition request successful');

        const result = await recognitionRes.json();

        // Log full result for debugging
        console.log('Full recognition result:', JSON.stringify(result, null, 2));

        // Extract species and confidence from the result
        // Fishial.AI returns: { results: [{ species: [{ name: "...", accuracy: 0.95 }] }] }
        let species = null;
        let confidence = null;
        let allSpecies: Array<{ name: string; accuracy: number }> = [];

        if (result.results && Array.isArray(result.results) && result.results.length > 0) {
            // Get the first result (most confident detection)
            const firstResult = result.results[0];

            if (firstResult.species && Array.isArray(firstResult.species) && firstResult.species.length > 0) {
                // Get the first (most confident) species from the array
                const topSpecies = firstResult.species[0];
                species = topSpecies.name || topSpecies.species_name || null;
                confidence = topSpecies.accuracy || topSpecies.confidence || null;

                // Collect all detected species for reference
                allSpecies = firstResult.species.map((s: any) => ({
                    name: s.name || s.species_name || 'Unknown',
                    accuracy: s.accuracy || s.confidence || 0
                }));
            }
        } else if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            // Fallback: try data array structure
            const firstResult = result.data[0];
            species = firstResult.species || firstResult.species_name || firstResult.name || null;
            confidence = firstResult.confidence || firstResult.confidence_score || firstResult.accuracy || null;
        } else if (result.species) {
            // Fallback: direct species field
            species = result.species;
            confidence = result.confidence || result.confidence_score || result.accuracy || null;
        }

        // If no species detected, add a helpful note
        if (!species) {
            console.warn('No fish species detected in image');
            return NextResponse.json({
                species: null,
                confidence: null,
                note: 'No fish detected. Try a clearer photo of a supported species. The image may be too blurry, dark, or not contain a recognizable fish species.',
                allSpecies: [],
                ...result, // Include full response for debugging
            });
        }

        return NextResponse.json({
            species: species,
            confidence: confidence,
            allSpecies: allSpecies, // Include all detected species with their accuracies
            ...result, // Include full response for debugging
        });

    } catch (error: any) {
        console.error('Fish identification error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error.message || 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}

