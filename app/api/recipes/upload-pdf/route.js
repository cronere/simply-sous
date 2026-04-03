import { put } from '@vercel/blob'

export const maxDuration = 60

export async function POST(request) {
  try {
    const filename = request.headers.get('x-filename') || 'recipe-upload.pdf'
    const contentType = request.headers.get('content-type') || 'application/pdf'

    // Stream the file directly to Vercel Blob — no 4.5MB limit here
    const blob = await put(`pdf-imports/${Date.now()}-${filename}`, request.body, {
      access: 'public',
      contentType,
    })

    return Response.json({ url: blob.url })
  } catch (err) {
    console.error('PDF upload error:', err)
    return Response.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
