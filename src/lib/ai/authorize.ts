// @polsia:user-owned
//
// Who may call POST /api/ai/chat. Return null to allow, or a Response to refuse
// (the route returns it and never calls the AI proxy). Open by default; recipes
// in the ai module AGENT.md. Edit in place, keep the signature, and do not read
// the body here (use req.clone()).

import 'server-only';

export async function authorizeAiChat(_req: Request): Promise<Response | null> {
  return Response.json({ error: 'ai_chat_disabled' }, { status: 403 });
}
