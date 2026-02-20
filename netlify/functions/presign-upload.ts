import { withCors } from './_shared/cors';
import { ENV } from './_shared/env';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

export const config = { path: '/.netlify/functions/presign-upload' };

export const handler = withCors(async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  try {
    const bucket = ENV.AWS_BUCKET_NAME();
    const region = ENV.AWS_REGION();
    const accessKeyId = ENV.AWS_ACCESS_KEY_ID();
    const secretAccessKey = ENV.AWS_SECRET_ACCESS_KEY();

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      // Fallback mock if env not configured (useful for local UI wiring)
      return new Response(
        JSON.stringify({
          mock: true,
          url: 'https://example.com/upload/placeholder-url',
          fields: {}
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    const keyPrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
    const filename = `${keyPrefix}/${crypto.randomUUID()}.webm`;
    const { url, fields } = await createPresignedPost(s3, {
      Bucket: bucket,
      Key: filename,
      Conditions: [
        ['content-length-range', 0, 1024 * 1024 * 200],
        ['starts-with', '$Content-Type', 'video/']
      ],
      Fields: { 'Content-Type': 'video/webm' },
      Expires: 60 // seconds
    });
    return new Response(JSON.stringify({ url, fields, key: filename, bucket, region }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Presign failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
