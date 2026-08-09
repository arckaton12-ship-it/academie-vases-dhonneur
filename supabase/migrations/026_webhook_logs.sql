-- webhook_logs: journal des appels webhook (inscription → Google Sheets)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url         text NOT NULL,
  payload     jsonb,
  status      integer,        -- HTTP status code (null si erreur réseau)
  response    text,           -- corps de la réponse (truncaté à 2000 chars)
  error       text,           -- message d'erreur si échec
  created_at  timestamptz DEFAULT now()
);

-- Seul l'admin peut lire les logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin peut lire les webhook_logs"
  ON webhook_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMINISTRATEUR'
    )
  );

-- Insertion possible par le client (anon ou auth) pour logger ses propres appels
CREATE POLICY "Anyone can insert webhook_logs"
  ON webhook_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
