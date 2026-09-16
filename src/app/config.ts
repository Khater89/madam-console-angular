export const DEFAULTS = {
  url: 'https://eviqqynpcmyukaijelxg.supabase.co',
  key: 'sb_publishable_8ie-cUObKlxbhqqh_pwuxg_OxyNf4b8',
  hook: 'https://jacob-89.app.n8n.cloud/webhook/madama-engine-run',
  fn_telegram: 'bright-processor',
  fn_rewrite: '',
  who: 'Khater'
};

export const PLATFORMS = ['facebook', 'instagram', 'linkedin'];
export const PLATNAME: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn' };
export const MEDIA = ['Text Only', 'Image', 'Short Video', 'Image + Short Video'];

export const RATE = { textIn: 2 / 1e6, textOut: 12 / 1e6, imgOut: 30 / 1e6, imgTok: 6000, vid720: 0.1014, mul1080: 1.55, creditUSD: 0.027, vqa: 0.01 };
export const TOK = { draft: { i: 2200, o: 900 }, polish: { i: 1800, o: 900 }, imgqa: { i: 1600, o: 250 } };

export let CFG = { ...DEFAULTS };

export function loadCfg() {
  try {
    const saved = JSON.parse(localStorage.getItem('madama.cfg') || '{}');
    CFG = { ...DEFAULTS, ...saved };
  } catch (e) {
    CFG = { ...DEFAULTS };
  }
}

export function saveCfg(newCfg: any) {
  CFG = { ...newCfg };
  try {
    localStorage.setItem('madama.cfg', JSON.stringify(CFG));
  } catch (e) {}
}

export function getCfg() {
  return CFG;
}

export async function api(path: string, opts: any = {}) {
  if (!CFG.url || !CFG.key) throw new Error('Set the connection first.');
  const h: any = { 'apikey': CFG.key, 'Content-Type': 'application/json' };
  if (opts.prefer) h['Prefer'] = opts.prefer;
  
  const res = await fetch(CFG.url.replace(/\/$/, '') + '/rest/v1/' + path, {
    method: opts.method || 'GET',
    headers: h,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && (data.message || data.hint)) || `${res.status} ${res.statusText}`);
  return data;
}

export function fnSlug(which: 'telegram' | 'rewrite') {
  return String(CFG[`fn_${which}` as keyof typeof CFG] || DEFAULTS[`fn_${which}` as keyof typeof DEFAULTS]).trim().replace(/^\/+|\/+$/g, '');
}

export function fnUrl(which: 'telegram' | 'rewrite') {
  return CFG.url.replace(/\/$/, '') + '/functions/v1/' + fnSlug(which);
}

export async function callFn(which: 'telegram' | 'rewrite', body: any) {
  if (!CFG.url || !CFG.key) throw new Error('set the connection first.');
  const slug = fnSlug(which);
  try {
    const res = await fetch(fnUrl(which), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': CFG.key },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) {}
    
    if (res.ok) return data || {};
    if (res.status === 404) throw new Error(`this project has no function called "${slug}". Open Supabase → Edge Functions, copy the last part of the function URL, and paste it into Connection.`);
    if (res.status === 401 || res.status === 403) throw new Error('the function refused the key. Open the function’s settings and turn "Verify JWT" off.');
    throw new Error((data && (data.error || data.message)) || `${res.status} ${res.statusText}`);
  } catch (netErr: any) {
    if (netErr.message.includes('this project has no function') || netErr.message.includes('refused the key')) throw netErr;
    throw new Error(`no answer from ${fnUrl(which)} (${netErr.message}). Check the slug under Connection, and that "Verify JWT" is off on that function.`);
  }
}
