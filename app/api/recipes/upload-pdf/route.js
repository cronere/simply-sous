import { handleUpload } from '@vercel/blob/client'

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('upload-pdf body type:', body?.type, 'payload:', JSON.stringify(body).slice(0, 200))

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        console.log('generating token for:', pathname)
        return {
          allowedContentTypes: [
            'application/pdf',
            'application/x-pdf', 
            'application/octet-stream',
            'binary/octet-stream',
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 200 * 1024 * 1024,
        }
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('PDF uploaded:', blob.url)
      },
    })

    console.log('handleUpload response:', JSON.stringify(jsonResponse).slice(0, 200))
    return Response.json(jsonResponse)
  } catch (err) {
    console.error('Blob upload handler error:', err.message, err.stack)
    return Response.json({ error: err.message, stack: err.stack }, { status: 400 })
  }
}
