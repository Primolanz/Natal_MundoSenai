CREATE TABLE public.tree_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 1 AND 500),
  ornament_type text NOT NULL CHECK (ornament_type IN ('card','bauble','mini_gift')),
  ornament_color text NOT NULL CHECK (ornament_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text NOT NULL CHECK (secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  ornament_finish text NOT NULL DEFAULT 'glossy' CHECK (ornament_finish IN ('glossy','matte','metallic')),
  sticker text NOT NULL DEFAULT 'none' CHECK (sticker IN ('none','star','snowflake','heart','holly')),
  tree_height_zone text NOT NULL CHECK (tree_height_zone IN ('top','middle','bottom')),
  tree_angular_position real NOT NULL CHECK (tree_angular_position >= 0 AND tree_angular_position < 360),
  ornament_customization jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '1 hour',
  status text NOT NULL DEFAULT 'active'
);
CREATE INDEX tree_messages_expires_idx ON public.tree_messages (expires_at);

CREATE OR REPLACE FUNCTION public.tree_messages_set_times()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.created_at := now();
  NEW.expires_at := now() + interval '1 hour';
  NEW.status := 'active';
  NEW.message := btrim(NEW.message);
  RETURN NEW;
END $$;
CREATE TRIGGER tree_messages_times BEFORE INSERT ON public.tree_messages
FOR EACH ROW EXECUTE FUNCTION public.tree_messages_set_times();

GRANT SELECT, INSERT ON public.tree_messages TO anon, authenticated;
GRANT ALL ON public.tree_messages TO service_role;
ALTER TABLE public.tree_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active messages" ON public.tree_messages FOR SELECT TO anon, authenticated USING (expires_at > now());
CREATE POLICY "Anyone can post a message" ON public.tree_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.tree_messages;