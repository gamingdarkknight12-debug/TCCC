// Shared across the fantasy API routes so isFantasyAuthed isn't copy-pasted
// per route the way the admin routes' isAuthed(req) currently is.
export function isFantasyAuthed(req) {
  const token = req.cookies.get('tccc_fantasy')?.value;
  return !!token && token === process.env.FANTASY_TOKEN;
}
