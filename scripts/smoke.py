"""Exercise the deployed C# -> Java integration using only the standard library."""
import json
import os
import urllib.request
import urllib.error
import uuid

BASE = os.environ.get('BASE_URL', 'http://127.0.0.1:18145')
TOKEN = os.environ.get('EDITOR_TOKEN', '')

def call(path, method='GET', body=None, expected=200, authenticated=True):
    headers = {'Content-Type': 'application/json'}
    if authenticated and TOKEN:
        headers['X-Editor-Token'] = TOKEN
    req = urllib.request.Request(BASE + path, data=None if body is None else json.dumps(body).encode(), headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            status, raw = response.status, response.read()
    except urllib.error.HTTPError as exc:
        status, raw = exc.code, exc.read()
    assert status == expected, f'{method} {path}: expected {expected}, got {status}: {raw.decode()}'
    return json.loads(raw) if raw and raw[:1] in (b'{', b'[') else raw.decode()

assert call('/health')['status'] == 'ok'
workspace = call('/api/workspace')
assert len(workspace['goals']) >= 4 and len([n for n in workspace['nodes'] if n['level'] == 4]) >= 8
priorities = call('/api/priorities?budget=200000')
assert len(priorities['priorities']) >= 8
assert 0 <= priorities['allocated'] <= 200000
assert priorities['remaining'] + priorities['allocated'] == 200000
assert all(priorities['priorities'][i]['score'] >= priorities['priorities'][i + 1]['score'] for i in range(len(priorities['priorities']) - 1))
assert call('/api/priorities?budget=0')['allocated'] == 0
call('/api/priorities?budget=-1', expected=400)
assert 'Strategy,Domain,Subdomain,Capability,Subcapability' in call('/api/export/capabilities.csv')
call('/api/goals', 'POST', {}, expected=401, authenticated=False)
if TOKEN:
    ident = 'smoke-' + uuid.uuid4().hex
    goal = {'id': ident, 'name': 'Smoke validation', 'metric': 'Validated (%)', 'owner': 'CI', 'target': 100}
    try:
        created = call('/api/goals', 'POST', goal, 201)
        assert any(g['id'] == ident for g in call('/api/workspace')['goals'])
        goal['target'] = 95
        goal['version'] = created['version']
        updated = call('/api/goals/' + ident, 'PUT', goal)
        assert updated['version'] == created['version'] + 1
        call('/api/goals/' + ident, 'PUT', goal, expected=409)
        call('/api/nodes/customer', 'DELETE', expected=409)
        assert any(a['entityId'] == ident for a in call('/api/workspace')['audit'])
    finally:
        call('/api/goals/' + ident, 'DELETE', expected=204)
print('PASS: health, catalog, C#-Java scoring, budget, CSV, protected writes and audited persistence.')
