-- Align the private storage bucket with the app's per-request image cap.
update storage.buckets
set file_size_limit = 4194304,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'wardrobe-private';
