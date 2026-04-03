import { handleUpload } from '@vercel/blob/client'

export async function POST(request) {
  const body = await request.json()

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          // Accept any PDF-like content type — browsers send different MIME types
          allowedContentTypes: [
            'application/pdf',
            'application/x-pdf',
            'application/octet-stream',
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 200 * 1024 * 1024, // 200MB
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
