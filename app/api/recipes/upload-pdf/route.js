import { handleUpload } from '@vercel/blob/client'

export async function POST(request) {
  const body = await request.json()

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ['application/pdf'],
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('PDF uploaded:', blob.url)
      },
    })
    return Response.json(jsonResponse)
  } catch (err) {
    console.error('Blob upload handler error:', err)
    return Response.json({ error: err.message }, { status: 400 })
  }
}
