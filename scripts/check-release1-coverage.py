"""Read the source workbook and report implemented live-UI checks; never edit XLSX."""
import html
import json
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/Users/txrn/Downloads/Eggprompt_Release1_Test_Scripts.xlsx')
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
import re
SPEC = ROOT / 'cypress/e2e/release1-excel.full.cy.js'
implemented = re.findall(r"test\('(R1-\d{2}-\d{2})'", SPEC.read_text())
EXCLUDED = {'R1-02-03', 'R1-02-04', 'R1-05-01'}
assert len(implemented) == 38 and len(set(implemented)) == 38 and not (set(implemented) & EXCLUDED)
RESULT = ROOT / 'cypress/results/latest-release1.json'
execution = json.loads(RESULT.read_text()) if RESULT.exists() else {}
executed = {test['id']: test for test in execution.get('tests', [])}
COVERAGE = {key: ('Implemented', 'Real browser flow; prerequisite requests use isolated CY41 fixtures. Execution: ' + executed.get(key, {}).get('state', 'NOT RUN')) for key in implemented}
COVERAGE.update({key: ('Excluded', 'Email-dependent workflow excluded from Cypress by user request; test separately if needed.') for key in EXCLUDED})
COVERAGE['R1-10-01'] = ('Implemented — API history check', 'Feed is submitted through the browser. History/date are verified with the real API because the current feed page has no history table.')
COVERAGE['R1-12-03'] = ('Implemented — frontend fix', 'Strict Excel requirement: cause is mandatory. The local frontend requires explicit selection. Deploy the corrected frontend before verifying on the VM.')

rows = []
with zipfile.ZipFile(SOURCE) as archive:
    strings = []
    if 'xl/sharedStrings.xml' in archive.namelist():
        strings = [''.join(n.itertext()) for n in ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('s:si', NS)]
    for name in archive.namelist():
        if not name.startswith('xl/worksheets/sheet') or not name.endswith('.xml'): continue
        for row in ET.fromstring(archive.read(name)).findall('.//s:sheetData/s:row', NS):
            values = {}
            for cell in row.findall('s:c', NS):
                col = ''.join(c for c in cell.attrib['r'] if c.isalpha())
                v = cell.find('s:v', NS)
                inline = cell.find('s:is', NS)
                values[col] = (strings[int(v.text)] if cell.attrib.get('t') == 's' else (v.text or '')) if v is not None else ''.join(inline.itertext()) if inline is not None else ''
            if not values.get('A', '').startswith('R1-'): continue
            status, detail = COVERAGE.get(values['A'], ('Not covered', 'This workbook ID has no corresponding test implementation.'))
            rows.append({'id': values['A'], 'scenario': values.get('C', ''), 'expected': values.get('J', ''), 'coverage': status, 'detail': detail})
assert len(rows) == 41 and {r['id'] for r in rows} == set(implemented) | EXCLUDED
counts = dict(Counter(r['coverage'] for r in rows))
output = ROOT / 'cypress' / 'release1-coverage.html'
body = ''.join('<tr>' + ''.join('<td>' + html.escape(str(row[k])).replace('\n', '<br>') + '</td>' for k in ['id', 'scenario', 'expected', 'coverage', 'detail']) + '</tr>' for row in rows)
output.write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><title>Release 1 Live UI Coverage</title><style>body{font:15px/1.5 Arial;margin:28px;color:#233553}table{border-collapse:collapse;width:100%}td,th{padding:14px;border:1px solid #dce2ee;text-align:left;vertical-align:top}th{background:#254d84;color:white}tr:nth-child(even){background:#f5f7fb}h1{color:#254d84}</style><h1>Release 1 — Live UI Coverage</h1><p>Source: Eggprompt_Release1_Test_Scripts.xlsx — 41 manual cases. Original workbook unchanged.</p><p><b>38 Cypress tests map to the 41-case workbook; 3 email-dependent cases are excluded. Implementation does not mean all tests have passed.</b></p><p>This is a code-coverage mapping, not a pass/fail report. Read execution results separately. The Excel suite creates isolated QA records, changes test-account passwords, and excludes email delivery, verification and password-reset-link workflows. Review latest-release1.json for execution results.</p><table><thead><tr><th>Excel Test ID</th><th>Scenario (source)</th><th>Expected results (source)</th><th>Live UI coverage</th><th>Evidence / missing checks</th></tr></thead><tbody>''' + body + '</tbody></table></html>')
print(json.dumps({'source': str(SOURCE), 'cases': len(rows), 'coverage': counts, 'report': str(output)}, ensure_ascii=False))
