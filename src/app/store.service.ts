import { Injectable, signal, computed } from '@angular/core';
import { api, loadCfg, getCfg } from './config';

@Injectable({ providedIn: 'root' })
export class StoreService {
  brands = signal<any[]>([]);
  options = signal<any[]>([]);
  allRows = signal<any[]>([]);
  loading = signal(true);
  toastMsg = signal<string | null>(null);
  cfgMissing = signal(false);

  counts = computed(() => {
    const rows = this.allRows();
    const n = { queue: 0, review: 0, publish: 0, done: 0 };
    rows.forEach(r => n[this.stageOf(r) as keyof typeof n]++);
    return n;
  });

  stageOf(r: any) {
    const st = String(r.status || '').toLowerCase();
    if (st === 'published' || st === 'cancelled') return 'done';
    if (st === 'approved' || st === 'publishing' || st === 'partially published') return 'publish';
    if (st === 'needs review') return 'queue';
    
    const mt = r.media_type || 'Image';
    const copy = r.target_platform === 'facebook' ? r.generated_facebook : r.target_platform === 'instagram' ? r.generated_instagram : r.generated_linkedin;
    const produced = !!String(copy || '').trim() && 
      (!/image/i.test(mt) || !!r.image_url) && 
      (!/video/i.test(mt) || (r.video_status === 'Ready' && !!r.video_url));
      
    return produced ? 'review' : 'queue';
  }

  constructor() {
    loadCfg();
    this.refreshData();
  }

  async refreshData() {
    const CFG = getCfg();
    if (!CFG.url || !CFG.key) {
      this.cfgMissing.set(true);
      this.loading.set(false);
      return;
    }
    this.cfgMissing.set(false);
    
    try {
      if (this.brands().length === 0) {
        const [b, o] = await Promise.all([
          api('brands?select=*&active=eq.true'),
          api('brand_content_options?select=*&active=eq.true&content_type=eq.service')
        ]);
        this.brands.set(b);
        this.options.set(o);
      }
      const rows = await api('content_queue?select=*&order=row_created_at.desc&limit=200');
      this.allRows.set(rows);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  showToast(msg: string) {
    this.toastMsg.set(msg);
    setTimeout(() => this.toastMsg.set(null), 4000);
  }

  async deleteRow(id: string) {
    if (!confirm('Delete this item permanently?')) return;
    try {
      await api(`content_queue?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
      this.showToast('Deleted');
      this.refreshData();
    } catch (e: any) {
      this.showToast('Delete failed: ' + e.message);
    }
  }
}
