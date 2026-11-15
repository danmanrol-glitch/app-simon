import { supabase } from './supabase'

export const POST_IMAGES_BUCKET = 'post-images'
const MAX_INPUT_BYTES = 15 * 1024 * 1024 // foto original del celular
const MAX_DIMENSION = 1600

/** Reduce la foto a máx. 1600 px y la convierte a JPEG (~200-500 KB) antes de subirla. */
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen.')
  if (file.size > MAX_INPUT_BYTES) throw new Error('La foto pesa más de 15 MB.')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('No pudimos leer esa foto. Prueba con una JPG o PNG.')
  }
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Tu navegador no pudo procesar la foto.')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
  if (!blob) throw new Error('Tu navegador no pudo procesar la foto.')
  return blob
}

export function postImageUrl(path: string) {
  return supabase.storage.from(POST_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl
}
