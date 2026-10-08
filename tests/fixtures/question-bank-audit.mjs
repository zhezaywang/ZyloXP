import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

export const root = fileURLToPath(new URL('../../', import.meta.url));
const defaultBank = process.env.ZYLOXP_QUESTION_BANK_DIR || join(root, 'electrical_engineering_question_bank_250000');
const fixture = JSON.parse(readFileSync(new URL('./question-supported-variants.json', import.meta.url), 'utf8'));

export function fullBankAvailability(bank = defaultBank) {
  const missing = ['question_database.csv', 'image_database.json', 'images'].filter((path) => !existsSync(join(bank, path)));
  return { available: missing.length === 0, reason: missing.length ? `External bank unavailable: ${missing.join(', ')} in ${bank}` : null };
}

function readSupportedFixture() {
  const families = {}, variants = [];
  for (const [template, group] of Object.entries(fixture.groups)) {
    families[template] = { subtopic: group.subtopic, rows: group.rows };
    for (const [id, promptIndex, tokens, answer, coverage] of group.variants) {
      let index = 0;
      const prompt = group.prompts[promptIndex].replaceAll('{}', () => tokens[index++]);
      if (index !== tokens.length || prompt.includes('undefined')) throw new Error(`Invalid fixture tokens: ${id}`);
      variants.push({ id, template, subtopic: group.subtopic, prompt, answer, coverage, options: [answer], correctIndex: 0 });
    }
  }
  return { source: 'committed-fixture', provenance: fixture.provenance, families, variants };
}

// Normal tests need no external bank or Python. Coverage counts describe the fixture snapshot.
export function readBankVariants({ full = false, bank = defaultBank } = {}) {
  const availability = full ? fullBankAvailability(bank) : null;
  if (!full || !availability.available) return { ...readSupportedFixture(), fullAuditSkipped: availability?.reason || null };
  return JSON.parse(execFileSync('python3', ['-c', `
import csv, json, collections
from pathlib import Path
root = Path(${JSON.stringify(root)})
bank = Path(${JSON.stringify(bank)})
families, unique, images = {}, {}, []
with (bank / 'question_database.csv').open(newline='') as source:
    for row in csv.DictReader(source):
        template = row['template_id']
        family = families.setdefault(template, {'subtopic': row['subtopic'], 'rows': 0, 'imageRows': 0})
        family['rows'] += 1
        if row['image_id']:
            family['imageRows'] += 1
            images.append({key: row[key] for key in ['question_id', 'template_id', 'subtopic', 'question', 'image_id', 'image_path']})
        if not template.endswith('-01'):
            continue
        prompt = row['question'].split(']: ', 1)[-1]
        key = (template, prompt)
        if key not in unique:
            unique[key] = {'id': row['question_id'], 'template': template, 'subtopic': row['subtopic'], 'prompt': prompt,
                           'options': [row['option_' + c] for c in 'abcdef'], 'correctIndex': ord(row['correct_option']) - ord('A'),
                           'answer': row['correct_answer'], 'coverage': 0}
        unique[key]['coverage'] += 1
print(json.dumps({'source': 'external-bank', 'families': families, 'variants': list(unique.values()), 'images': images}))
`], { maxBuffer: 32 * 1024 * 1024, encoding: 'utf8' }));
}

export function readReferenceAudit({ full = false, bank = defaultBank } = {}) {
  const availability = full ? fullBankAvailability(bank) : null;
  if (!full || !availability.available) return {
    source: 'bundled-references', fullAuditSkipped: availability?.reason || null,
    local: fixture.references.map((reference) => ({ ...reference, svg: readFileSync(join(root, 'public/question-bank/images', reference.file), 'utf8') })),
  };
  return JSON.parse(execFileSync('python3', ['-c', `
import csv, json, re, collections, xml.etree.ElementTree as ET
from pathlib import Path
root = Path(${JSON.stringify(root)})
bank = Path(${JSON.stringify(bank)})
metadata = {item['image_id']: item for item in json.loads((bank / 'image_database.json').read_text())}
errors, local, families = [], [], collections.Counter()
ns = '{http://www.w3.org/2000/svg}'
with (bank / 'question_database.csv').open(newline='') as source:
    for row in csv.DictReader(source):
        if not row['image_id']:
            continue
        meta = metadata.get(row['image_id'])
        if not meta:
            errors.append(row['question_id'] + ': missing image metadata')
            continue
        for key in ['question_id', 'template_id', 'subtopic', 'topic']:
            if meta[key] != row[key]: errors.append(row['question_id'] + ': ' + key + ' mismatch')
        prompt = row['question'].split(']: ', 1)[-1]
        paths = [('upstream', bank / meta['relative_path'])]
        target = root / 'public/question-bank/images' / Path(meta['relative_path']).name
        if target.exists(): paths.append(('local', target))
        for scope, path in paths:
            try:
                svg = ET.parse(path).getroot()
                if svg.findtext(ns + 'desc') != prompt: errors.append(str(path) + ': description mismatch')
                if svg.findtext(ns + 'title') != row['subtopic'] + ' problem diagram': errors.append(str(path) + ': title mismatch')
                if svg.attrib.get('viewBox') != '0 0 960 600': errors.append(str(path) + ': unexpected viewBox')
                text = ''.join(svg.itertext())
                if row['image_id'] not in text or row['question_id'] not in text: errors.append(str(path) + ': missing identity')
                if scope == 'local': local.append({'file': path.name, 'questionId': row['question_id'], 'subtopic': row['subtopic']})
            except (ET.ParseError, OSError) as error: errors.append(str(path) + ': ' + str(error))
        families[row['template_id']] += 1
print(json.dumps({'imageCount': sum(families.values()), 'metadataCount': len(metadata), 'families': families, 'local': local, 'errors': errors}))
`], { maxBuffer: 4 * 1024 * 1024, encoding: 'utf8' }));
}

export async function loadQuestionAudit() {
  const server = await createServer({ root, cacheDir: 'node_modules/.cache/zyloxp-question-audit', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [{ name: 'question-audit-private-data-helpers', enforce: 'pre', transform(code, id) {
      if (id === `${root}src/data.ts`) return `${code}\nexport { getVisualValues, polishQuestionCopy };`;
    } }],
  });
  try {
    const data = await server.ssrLoadModule('/src/data.ts');
    const { QuestionSchematic } = await server.ssrLoadModule('/src/QuestionSchematic.tsx');
    const census = readBankVariants();
    const variants = census.variants.map((row) => ({
      ...data.lessonQuestions.find((question) => question.subtopic === row.subtopic),
      ...row,
      prompt: data.polishQuestionCopy(row.prompt),
      options: row.options.map(data.polishQuestionCopy),
      visualValues: data.getVisualValues(row.prompt),
    }));
    return { server, data, QuestionSchematic, census, variants };
  } catch (error) {
    await server.close();
    throw error;
  }
}
