import { supabase } from './supabase'

const AVATAR_BUCKET = 'avatars'
export const AVATAR_MAX_SIZE = 5 * 1024 * 1024

export function isAvatarFile(file: File): boolean {
  return file.type.startsWith('image/') && file.size <= AVATAR_MAX_SIZE
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  if (!isAvatarFile(file)) {
    throw new Error('La photo doit être une image de 5 Mo maximum.')
  }
  const { error: rateError } = await supabase.rpc('check_upload_limit', {
    p_action: 'upload',
    p_bucket: AVATAR_BUCKET,
  })
  if (rateError) throw rateError
  const ext = (file.name.split('.').pop() ?? 'jpg').replace(/[^\w]/g, '').toLowerCase() || 'jpg'
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'image/jpeg',
  })
  if (error) throw error
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function updateAvatarUrl(userId: string, url: string | null) {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', userId)
  if (error) throw error
}
