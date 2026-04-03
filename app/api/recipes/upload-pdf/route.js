import { handleUpload } from '@vercel/blob/server'

export async function POST(request) {
  const body = await request.json()

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Allow PDF uploads only
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
        }
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('PDF uploaded to blob:', blob.url)
      },
    })
    return Response.json(jsonResponse)
  } catch (err) {
    console.error('Blob upload handler error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
