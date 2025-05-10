-- supabase/migrations/20250510203057add_character_npc_trigger.sql

-- Drop if exists (for idempotency)
DROP TRIGGER IF EXISTS set_character_as_non_npc ON player_character;
DROP TRIGGER IF EXISTS check_character_npc_status ON player_character;
DROP FUNCTION IF EXISTS update_character_npc_status();

-- Create function and triggers
CREATE OR REPLACE FUNCTION update_character_npc_status() RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT: Set is_npc to false for the character being associated with a player
    IF TG_OP = 'INSERT' THEN
        UPDATE character
        SET is_npc = false
        WHERE id = NEW.character_id;
        
    -- For DELETE: Check if character still has any player associations
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE character
        SET is_npc = NOT EXISTS (
            SELECT 1 FROM player_character 
            WHERE character_id = OLD.character_id
        )
        WHERE id = OLD.character_id;
    END IF;
    
    RETURN NULL; -- For AFTER triggers
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT
CREATE TRIGGER set_character_as_non_npc
AFTER INSERT ON player_character
FOR EACH ROW
EXECUTE FUNCTION update_character_npc_status();

-- Trigger for DELETE
CREATE TRIGGER check_character_npc_status
AFTER DELETE ON player_character
FOR EACH ROW
EXECUTE FUNCTION update_character_npc_status();