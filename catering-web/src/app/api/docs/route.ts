// GET /api/docs -> human-readable HTML documentation for the mobile REST API.
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Catering Shifts Planner — REST API</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.6; max-width: 880px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
  h1 { margin-bottom: .25rem; }
  .sub { color: #888; margin-top: 0; }
  h2 { margin-top: 2.5rem; border-bottom: 1px solid #8884; padding-bottom: .3rem; }
  .ep { border: 1px solid #8884; border-radius: 10px; padding: 1rem 1.25rem; margin: 1rem 0; }
  .method { display: inline-block; font-weight: 700; font-size: .8rem; padding: .15rem .5rem; border-radius: 6px; margin-right: .5rem; }
  .get { background: #2563eb22; color: #2563eb; }
  .post { background: #16a34a22; color: #16a34a; }
  code { background: #8882; padding: .1rem .35rem; border-radius: 4px; font-size: .9em; }
  pre { background: #8881; padding: .85rem 1rem; border-radius: 8px; overflow-x: auto; font-size: .85rem; }
  .path { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 600; }
  .auth { font-size: .8rem; color: #d97706; font-weight: 600; }
  table { border-collapse: collapse; width: 100%; font-size: .9rem; }
  td, th { border: 1px solid #8884; padding: .4rem .6rem; text-align: left; }
</style>
</head>
<body>
  <h1>🍽️ Catering Shifts Planner — REST API</h1>
  <p class="sub">Minimal API for the mobile (Expo) client. All responses are JSON unless noted.</p>

  <h2>Authentication</h2>
  <p>Call <code>POST /api/auth/login</code> to obtain a JWT. Send it on every other request as a header:</p>
  <pre>Authorization: Bearer &lt;token&gt;</pre>
  <p>Tokens expire after 7 days. Missing/invalid tokens return <code>401</code>.</p>

  <h2>Endpoints</h2>

  <div class="ep">
    <p><span class="method post">POST</span><span class="path">/api/auth/login</span></p>
    <p>Log in with email + password.</p>
    <p>Request body:</p>
    <pre>{ "email": "steve@gmail.com", "password": "pass123" }</pre>
    <p>Response <code>200</code>:</p>
    <pre>{ "token": "&lt;jwt&gt;", "user": { "id": 1, "name": "Steve", "email": "steve@gmail.com" } }</pre>
    <p>Errors: <code>400</code> missing fields, <code>401</code> invalid credentials.</p>
  </div>

  <div class="ep">
    <p><span class="method get">GET</span><span class="path">/api/shifts</span> <span class="auth">· Bearer required</span></p>
    <p>List <strong>active</strong> shifts (upcoming/current, not canceled) in the user's groups, paged.</p>
    <table>
      <tr><th>Query param</th><th>Default</th><th>Notes</th></tr>
      <tr><td>page</td><td>1</td><td>1-based page number</td></tr>
      <tr><td>pageSize</td><td>10</td><td>max 50</td></tr>
    </table>
    <p>Response <code>200</code>:</p>
    <pre>{
  "items": [
    {
      "id": 1, "title": "Grand Hall Evening Service",
      "date": "2026-06-09", "startTime": "18:00:00", "endTime": "23:00:00",
      "location": "The Grand Hall", "groupId": 1, "groupTitle": "City Catering Team",
      "capacity": 100, "staffCount": 7, "commentCount": 3,
      "state": { "temporal": "upcoming", "capacity": "under", "canceled": false, "isActive": true },
      "isJoined": false
    }
  ],
  "page": 1, "pageSize": 10, "total": 3, "totalPages": 1
}</pre>
  </div>

  <div class="ep">
    <p><span class="method get">GET</span><span class="path">/api/shifts/{id}</span> <span class="auth">· Bearer required</span></p>
    <p>Full shift details. Members only.</p>
    <p>Response <code>200</code>:</p>
    <pre>{
  "id": 1, "title": "Grand Hall Evening Service",
  "date": "2026-06-09", "startTime": "18:00:00", "endTime": "23:00:00",
  "location": "The Grand Hall", "groupId": 1, "groupTitle": "City Catering Team",
  "capacity": 100, "staffCount": 7, "commentCount": 3,
  "state": { "temporal": "upcoming", "capacity": "under", "canceled": false, "isActive": true },
  "isJoined": true, "extraSlots": 1,
  "staff": [ { "userId": 1, "name": "Steve", "extraSlots": 0 } ],
  "comments": [ { "id": 1, "userId": 1, "authorName": "Steve", "body": "...", "createdAt": "...", "editedAt": null } ]
}</pre>
    <p>Errors: <code>403</code> not a member, <code>404</code> not found.</p>
  </div>

  <div class="ep">
    <p><span class="method post">POST</span><span class="path">/api/shifts/{id}/join</span> <span class="auth">· Bearer required</span></p>
    <p>Join a shift (no-op if already joined). The shift must be active.</p>
    <p>Response <code>200</code>: <code>{ "ok": true }</code></p>
    <p>Errors: <code>403</code> not a member, <code>404</code> not found, <code>409</code> shift closed.</p>
  </div>

  <div class="ep">
    <p><span class="method post">POST</span><span class="path">/api/shifts/{id}/leave</span> <span class="auth">· Bearer required</span></p>
    <p>Leave a shift. The shift must be active.</p>
    <p>Response <code>200</code>: <code>{ "ok": true }</code></p>
  </div>

  <div class="ep">
    <p><span class="method post">POST</span><span class="path">/api/shifts/{id}/slots</span> <span class="auth">· Bearer required</span></p>
    <p>Set the number of reserved extra slots (0–3) for your join. You must have joined first.</p>
    <p>Request body:</p>
    <pre>{ "extraSlots": 2 }</pre>
    <p>Response <code>200</code>: <code>{ "ok": true }</code></p>
    <p>Errors: <code>409</code> not joined / shift closed.</p>
  </div>

  <div class="ep">
    <p><span class="method get">GET</span><span class="path">/api/docs</span></p>
    <p>This page.</p>
  </div>
</body>
</html>`;

export function GET() {
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
