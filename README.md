# WhatsApp AI Marketing - Core WASenderAPI

Projet de Marketing IA pour WhatsApp basé sur **WasenderAPI** et le **Model Context Protocol (MCP)**.

## 🚀 Configuration MCP

Le fichier de configuration MCP a été préparé dans `C:\Users\HP\.gemini\mcp.json`.

### Étapes d'activation :
1. Récupérez votre **Personal Access Token** sur le tableau de bord WasenderAPI (`Settings > Personal Access Tokens`).
2. Remplacez `VOTRE_PERSONAL_ACCESS_TOKEN_WASENDER` dans `C:\Users\HP\.gemini\mcp.json` par votre vrai jeton d'accès.
3. Redémarrez Antigravity ou votre environnement MCP pour charger les outils WasenderAPI.

## 🛠️ Outils disponibles via WASenderAPI MCP

- **Gestion des Sessions** (`connect_whatsapp_session`, `list_whatsapp_sessions`, `get_session_logs`...)
- **Envoi de Messages** (`send_text_message`, `send_image_message`, `send_audio_message`, `send_document_message`, `send_poll_message`...)
- **Gestion des Contacts & Leads** (`list_contacts`, `search_contacts`, `check_jid_on_whatsapp`, `add_or_edit_contact`...)
- **Gestion des Groupes & Communautés** (`list_groups`, `create_group`, `add_group_participants`, `generate_invite_link`...)
