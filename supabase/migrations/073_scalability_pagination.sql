-- Scalability: paginated students + messages + search
-- RPC: getStudentsPaginated(page, pageSize, search?, classId?)
-- Returns students with total count for pagination

CREATE OR REPLACE FUNCTION public.getStudentsPaginated(
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 50,
  p_search TEXT DEFAULT NULL,
  p_class_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  tribe TEXT,
  department TEXT,
  role user_role,
  class_id UUID,
  active BOOLEAN,
  avatar_url TEXT,
  meditation_grade NUMERIC,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  WITH filtered AS (
    SELECT p.*
    FROM profiles p
    WHERE (p_search IS NULL OR p_search = '' 
           OR p.first_name ILIKE '%' || p_search || '%'
           OR p.last_name ILIKE '%' || p_search || '%'
           OR p.email ILIKE '%' || p_search || '%')
      AND (p_class_id IS NULL OR p.class_id = p_class_id)
      AND p.role = 'ETUDIANT'
  ),
  counted AS (
    SELECT *, COUNT(*) OVER() AS total_count
    FROM filtered
    ORDER BY created_at DESC
  )
  SELECT c.id, c.email, c.first_name, c.last_name, c.phone, c.tribe, 
         c.department, c.role, c.class_id, c.active, c.avatar_url, 
         c.meditation_grade, c.created_at, c.total_count
  FROM counted c
  LIMIT p_page_size
  OFFSET (p_page - 1) * p_page_size;
$$;

-- RPC: getMessagesPaginated(conversationId, page, pageSize)
-- Returns messages with total count for lazy loading

CREATE OR REPLACE FUNCTION public.getMessagesPaginated(
  p_conversation_id UUID,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  WITH counted AS (
    SELECT m.*, COUNT(*) OVER() AS total_count
    FROM messages m
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.created_at DESC
  )
  SELECT c.id, c.conversation_id, c.sender_id, c.content, c.created_at, c.total_count
  FROM counted c
  LIMIT p_page_size
  OFFSET (p_page - 1) * p_page_size;
$$;

-- RPC: searchProfilesPaginated(search, page, pageSize, role?)
-- General search for messaging, admin, etc.

CREATE OR REPLACE FUNCTION public.searchProfilesPaginated(
  p_search TEXT,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 20,
  p_role user_role DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role user_role,
  class_id UUID,
  avatar_url TEXT,
  total_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  WITH filtered AS (
    SELECT p.id, p.email, p.first_name, p.last_name, p.role, p.class_id, p.avatar_url
    FROM profiles p
    WHERE (p.first_name ILIKE '%' || p_search || '%'
           OR p.last_name ILIKE '%' || p_search || '%'
           OR p.email ILIKE '%' || p_search || '%')
      AND (p_role IS NULL OR p.role = p_role)
  ),
  counted AS (
    SELECT *, COUNT(*) OVER() AS total_count
    FROM filtered
    ORDER BY first_name, last_name
  )
  SELECT c.id, c.email, c.first_name, c.last_name, c.role, c.class_id, c.avatar_url, c.total_count
  FROM counted c
  LIMIT p_page_size
  OFFSET (p_page - 1) * p_page_size;
$$;
