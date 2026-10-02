"""Create a non-seed sentinel before restart, then verify and remove it."""
import json
import os
import sys
import urllib.request

base = os.environ.get('BASE_URL', 'http://127.0.0.1:18095')
token = os.environ['EDITOR_TOKEN']
ident = 'persistence-sentinel'
headers = {'Content-Type': 'application/json', 'X-Editor-Token': token}
if sys.argv[1] == 'before':
    payload = {'id': ident, 'name': 'Persisted restart sentinel', 'metric': 'Recovery (%)', 'owner': 'CI', 'target': 99}
    with urllib.request.urlopen(urllib.request.Request(base + '/api/goals', data=json.dumps(payload).encode(), method='POST', headers=headers)) as r:
        assert r.status == 201
    print('PASS: custom sentinel created before restart.')
else:
    with urllib.request.urlopen(base + '/api/workspace') as r:
        goals = json.load(r)['goals']
    assert any(g['id'] == ident and g['target'] == 99 for g in goals), 'Persisted sentinel missing after restart.'
    with urllib.request.urlopen(urllib.request.Request(base + '/api/goals/' + ident, method='DELETE', headers=headers)) as r:
        assert r.status == 204
    print('PASS: non-seed data survived catalog restart; sentinel removed.')
