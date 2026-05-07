import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL

const s3Endpoint = process.env.SUPABASE_STORAGE_S3_ENDPOINT
const s3Region = process.env.SUPABASE_STORAGE_S3_REGION
const s3AccessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID
const s3SecretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const canUseS3 =
  Boolean(s3Endpoint) && Boolean(s3Region) && Boolean(s3AccessKeyId) && Boolean(s3SecretAccessKey)

const s3Client = canUseS3
  ? new S3Client({
      forcePathStyle: true,
      region: s3Region,
      endpoint: s3Endpoint,
      credentials: {
        accessKeyId: s3AccessKeyId as string,
        secretAccessKey: s3SecretAccessKey as string,
      },
    })
  : null

export const supabaseAdmin =
  !canUseS3 && serviceRoleKey && supabaseUrl
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null

export function getStorageBucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'tnx-pro'
}

function inferSupabaseProjectUrlFromS3Endpoint(endpoint: string) {
  try {
    const url = new URL(endpoint)
    const host = url.hostname
    const marker = '.storage.supabase.co'
    if (!host.endsWith(marker)) return null
    const projectRef = host.slice(0, -marker.length)
    if (!projectRef) return null
    return `https://${projectRef}.supabase.co`
  } catch {
    return null
  }
}

function getSupabaseProjectUrl() {
  if (supabaseUrl) return supabaseUrl
  if (s3Endpoint) return inferSupabaseProjectUrlFromS3Endpoint(s3Endpoint)
  return null
}

export function getPublicUrlForObject(objectPath: string) {
  const bucket = getStorageBucketName()
  const projectUrl = getSupabaseProjectUrl()
  if (!projectUrl) {
    throw new Error(
      'Cannot build public URL: set SUPABASE_URL, or set SUPABASE_STORAGE_S3_ENDPOINT so the project ref can be inferred.',
    )
  }
  return `${projectUrl}/storage/v1/object/public/${bucket}/${objectPath}`
}

export function tryExtractObjectPathFromPublicUrl(publicUrl: string) {
  const bucket = getStorageBucketName()
  try {
    const url = new URL(publicUrl)
    const marker = `/storage/v1/object/public/${bucket}/`
    const idx = url.pathname.indexOf(marker)
    if (idx === -1) return null
    return url.pathname.slice(idx + marker.length)
  } catch {
    return null
  }
}

export async function uploadObject(options: {
  objectPath: string
  body: Buffer
  contentType?: string
}) {
  const bucket = getStorageBucketName()

  if (s3Client) {
    try {
      const result = await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: options.objectPath,
          Body: options.body,
          ContentType: options.contentType,
        }),
      )
      return { provider: 's3' as const, etag: result.ETag ?? null }
    } catch (error: any) {
      const message = String(error?.message || error || 'Unknown S3 error')
      const name = String(error?.name || '')
      const statusCode: number | undefined = error?.$metadata?.httpStatusCode
      const status = statusCode ? ` (HTTP ${statusCode})` : ''

      if (name === 'NoSuchBucket' || /bucket not found/i.test(message)) {
        const e = new Error(
          `Bucket not found (${bucket}). Create this bucket in Supabase Storage or set SUPABASE_STORAGE_BUCKET to an existing bucket name.`,
        )
        ;(e as any).status = 404
        throw e
      }

      const e = new Error(`Supabase S3 upload failed${status}: ${name ? `${name}: ` : ''}${message}`)
      if (statusCode) {
        ;(e as any).status = statusCode
      }
      throw e
    }
  }

  if (!supabaseAdmin) {
    throw new Error(
      'Supabase Storage is not configured. Set either S3 env vars (SUPABASE_STORAGE_S3_*/SUPABASE_S3_*) or SUPABASE_SERVICE_ROLE_KEY.',
    )
  }

  const result = await supabaseAdmin.storage.from(bucket).upload(options.objectPath, options.body, {
    contentType: options.contentType,
    upsert: false,
  })

  if (result.error) {
    const message = result.error.message || 'Unknown storage error'
    if (/bucket/i.test(message) && /not found/i.test(message)) {
      const e = new Error(
        `Bucket not found (${bucket}). Create this bucket in Supabase Storage or set SUPABASE_STORAGE_BUCKET to an existing bucket name.`,
      )
      ;(e as any).status = 404
      throw e
    }
    const e = new Error(message)
    const statusCode = (result.error as any)?.statusCode
    if (typeof statusCode === 'number') {
      ;(e as any).status = statusCode
    }
    throw e
  }

  return { provider: 'supabase-js' as const, etag: null }
}

export async function removeObject(objectPath: string) {
  const bucket = getStorageBucketName()

  if (s3Client) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: objectPath,
        }),
      )
      return
    } catch (error: any) {
      const message = String(error?.message || error || 'Unknown S3 error')
      const name = String(error?.name || '')
      const status = error?.$metadata?.httpStatusCode ? ` (HTTP ${error.$metadata.httpStatusCode})` : ''
      throw new Error(`Supabase S3 delete failed${status}: ${name ? `${name}: ` : ''}${message}`)
    }
  }

  if (!supabaseAdmin) {
    throw new Error(
      'Supabase Storage is not configured. Set either S3 env vars (SUPABASE_STORAGE_S3_*/SUPABASE_S3_*) or SUPABASE_SERVICE_ROLE_KEY.',
    )
  }

  const result = await supabaseAdmin.storage.from(bucket).remove([objectPath])
  if (result.error) {
    throw new Error(result.error.message)
  }
}
