import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { StoreService } from '../store.service';
import { PLATFORMS, PLATNAME, MEDIA, RATE, TOK, api, getCfg } from '../config';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <section class="max-w-6xl mx-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-bold tracking-tight text-slate-900">New order</h2>
        <p class="text-slate-500 mt-2">Configure and schedule a new marketing content generation run.</p>
      </div>
      
      <div *ngIf="store.cfgMissing()" class="bg-rose-50 border border-rose-200 rounded-3xl p-8 mb-8 text-center flex flex-col items-center">
        <div class="bg-rose-100 text-rose-600 p-3 rounded-full mb-4 inline-flex"><mat-icon>link_off</mat-icon></div>
        <h2 class="text-xl font-bold text-slate-900 mb-2">Not connected yet</h2>
        <p class="text-slate-600 mb-6 max-w-md">You need to connect to your Supabase instance to load companies and services.</p>
        <button class="bg-rose-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-rose-700 transition shadow-sm flex items-center gap-2" (click)="goToSetup()">
          <mat-icon>settings_ethernet</mat-icon> Open Connection
        </button>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100">
            <div class="flex items-center gap-3 mb-6">
              <div class="bg-indigo-100 text-indigo-700 p-2 rounded-xl flex"><mat-icon>business</mat-icon></div>
              <div>
                <h2 class="text-xl font-semibold text-slate-900">Companies</h2>
                <p class="text-sm text-slate-500 mt-0.5">Select one or more brands.</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-3">
              <label *ngFor="let b of store.brands()" class="cursor-pointer">
                <input type="checkbox" class="sr-only" [checked]="selectedBrands.includes(b.brand_id)" (change)="toggleBrand(b.brand_id)" />
                <div class="px-5 py-2.5 rounded-full border transition-all text-sm font-medium flex items-center gap-2"
                     [class.bg-indigo-600]="selectedBrands.includes(b.brand_id)"
                     [class.text-white]="selectedBrands.includes(b.brand_id)"
                     [class.border-transparent]="selectedBrands.includes(b.brand_id)"
                     [class.bg-white]="!selectedBrands.includes(b.brand_id)"
                     [class.border-slate-200]="!selectedBrands.includes(b.brand_id)"
                     [class.text-slate-700]="!selectedBrands.includes(b.brand_id)"
                     [class.hover:bg-slate-50]="!selectedBrands.includes(b.brand_id)">
                  <mat-icon *ngIf="selectedBrands.includes(b.brand_id)" class="!text-[18px] !w-[18px] !h-[18px]">check</mat-icon>
                  {{ b.company_name || b.brand_id }}
                </div>
              </label>
            </div>
          </div>
          
          <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100">
            <div class="flex items-center gap-3 mb-6">
              <div class="bg-indigo-100 text-indigo-700 p-2 rounded-xl flex"><mat-icon>category</mat-icon></div>
              <div>
                <h2 class="text-xl font-semibold text-slate-900">Service</h2>
                <p class="text-sm text-slate-500 mt-0.5">Which product line to market.</p>
              </div>
            </div>
            <select [(ngModel)]="selectedService" class="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all cursor-pointer">
              <option value="__random__">Random pick from each company's services</option>
              <option *ngFor="let o of store.options()" [value]="o.option_value">{{ o.option_label || o.option_value }}</option>
            </select>
          </div>
          
          <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100">
            <div class="flex items-center gap-3 mb-6">
              <div class="bg-indigo-100 text-indigo-700 p-2 rounded-xl flex"><mat-icon>perm_media</mat-icon></div>
              <div>
                <h2 class="text-xl font-semibold text-slate-900">Platforms & media</h2>
                <p class="text-sm text-slate-500 mt-0.5">Asset types for each platform.</p>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <label *ngFor="let p of PLATFORMS" class="flex flex-col gap-2">
                <span class="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><mat-icon class="!text-[18px] !w-[18px] !h-[18px] text-slate-400">campaign</mat-icon>{{ PLATNAME[p] }}</span>
                <select [(ngModel)]="media[p]" class="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all cursor-pointer">
                  <option>Not used</option>
                  <option *ngFor="let m of MEDIA" [value]="m">{{ m }}</option>
                </select>
              </label>
            </div>
          </div>
        </div>
        
        <div class="lg:sticky lg:top-12 space-y-6">
          <div class="bg-indigo-600 rounded-3xl p-6 lg:p-8 shadow-md text-white">
            <h2 class="text-xl font-semibold mb-6 flex items-center gap-2"><mat-icon>schedule</mat-icon> Schedule</h2>
            
            <div class="space-y-4">
              <label class="flex flex-col gap-1.5">
                <span class="text-sm font-medium text-indigo-200">Plan</span>
                <select [(ngModel)]="plan" (ngModelChange)="plan = +$event" class="w-full rounded-xl border-indigo-500 bg-indigo-700/50 px-4 py-3 text-white outline-none focus:bg-indigo-700 focus:ring-2 focus:ring-white/20 transition-all cursor-pointer">
                  <option [value]="1">Post now — 1 slot</option>
                  <option [value]="4">Every other day — 4 slots</option>
                  <option [value]="7">Daily — 7 slots</option>
                </select>
              </label>
              
              <div class="grid grid-cols-2 gap-4">
                <label class="flex flex-col gap-1.5">
                  <span class="text-sm font-medium text-indigo-200">Date</span>
                  <input type="date" [(ngModel)]="startDate" class="w-full rounded-xl border-indigo-500 bg-indigo-700/50 px-4 py-3 text-white outline-none focus:bg-indigo-700 focus:ring-2 focus:ring-white/20 transition-all cursor-pointer" />
                </label>
                <label class="flex flex-col gap-1.5">
                  <span class="text-sm font-medium text-indigo-200">Hour</span>
                  <input type="number" [(ngModel)]="hour" class="w-full rounded-xl border-indigo-500 bg-indigo-700/50 px-4 py-3 text-white outline-none focus:bg-indigo-700 focus:ring-2 focus:ring-white/20 transition-all" />
                </label>
              </div>
            </div>
            
            <div class="mt-8 pt-8 border-t border-indigo-500">
              <div class="text-4xl font-bold tracking-tight">\${{ cost().toFixed(2) }}</div>
              <div class="text-indigo-200 text-sm mt-1 font-medium flex items-center gap-1.5">
                <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">inventory_2</mat-icon> {{ posts() ? posts() + ' posts total' : 'Pick a company to begin' }}
              </div>
            </div>
            
            <button class="w-full mt-8 bg-white text-indigo-600 font-bold py-4 px-6 rounded-2xl shadow hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]" 
                    [disabled]="!posts()" (click)="handleConfirm()">
              <mat-icon>rocket_launch</mat-icon> Confirm & run engine
            </button>
          </div>
        </div>
      </div>
    </section>
  `
})
export class OrderComponent {
  PLATFORMS = PLATFORMS;
  PLATNAME = PLATNAME;
  MEDIA = MEDIA;

  selectedBrands: string[] = [];
  selectedService = '__random__';
  media: Record<string, string> = { facebook: 'Not used', instagram: 'Not used', linkedin: 'Not used' };
  plan = 1;
  startDate = new Date().toISOString().split('T')[0];
  hour = 9;

  posts = computed(() => this.costData().posts);
  cost = computed(() => this.costData().cost);

  constructor(public store: StoreService) {}

  goToSetup() {
    document.querySelector<HTMLElement>('button[data-view="setup"]')?.click();
  }

  toggleBrand(id: string) {
    if (this.selectedBrands.includes(id)) {
      this.selectedBrands = this.selectedBrands.filter(b => b !== id);
    } else {
      this.selectedBrands = [...this.selectedBrands, id];
    }
  }

  costData() {
    let p = 0;
    let c = 0;
    
    this.selectedBrands.forEach(() => {
      Object.keys(this.media).forEach(plat => {
        if (this.media[plat] === 'Not used') return;
        for (let s = 0; s < this.plan; s++) {
          p++;
          const m = this.media[plat];
          const img = /image/i.test(m);
          const vid = /video/i.test(m);
          
          let cost = (TOK.draft.i * RATE.textIn + TOK.draft.o * RATE.textOut) + (TOK.polish.i * RATE.textIn + TOK.polish.o * RATE.textOut);
          if (img) cost += RATE.imgTok * RATE.imgOut + (TOK.imgqa.i * RATE.textIn + TOK.imgqa.o * RATE.textOut) + RATE.creditUSD;
          if (vid) {
            cost += 5 * RATE.vid720 + RATE.vqa + 5 * (14/60) * RATE.creditUSD; // Default 5s 720p for brevity
          }
          c += cost;
        }
      });
    });
    return { posts: p, cost: c };
  }

  async handleConfirm() {
    if (!this.posts()) return;
    if (!confirm(`Create ${this.posts()} post(s) and start the engine?\n\nEstimated API cost: $${this.cost().toFixed(2)}`)) return;
    
    const rows: any[] = [];
    const offsets = this.plan === 7 ? [0,1,2,3,4,5,6] : this.plan === 4 ? [0,2,4,6] : [0];
    const brands = this.store.brands();
    const options = this.store.options();
    
    let seq = 0;
    this.selectedBrands.forEach((bid, bi) => {
      const pool = options.filter(o => (o.brand_id||'').toLowerCase() === bid.toLowerCase());
      if (!pool.length) { this.store.showToast('No active services for ' + bid); return; }
      
      const plats = Object.keys(this.media).filter(p => this.media[p] !== 'Not used');
      offsets.forEach((off, si) => {
        plats.forEach((p, pi) => {
          seq++;
          const m = this.media[p];
          const img = /image/i.test(m);
          const vid = /video/i.test(m);
          let service = this.selectedService;
          if (service === '__random__') {
            service = pool[(si*plats.length + pi + bi) % pool.length].option_value;
          }
          
          const d = new Date(this.startDate + 'T00:00:00');
          d.setDate(d.getDate() + off);
          d.setHours(this.hour, 0, 0, 0);

          rows.push({
            id: bid + '-ui-' + Date.now().toString(36) + '-' + seq + '-' + Math.random().toString(36).slice(2,7),
            brand_id: bid,
            campaign: this.plan === 1 ? 'Instant Service Marketing' : 'Scheduled Service Marketing',
            content_pillar: service,
            topic_idea: `Create one English ${PLATNAME[p]} marketing post... Requested media package: ${m}.`,
            scheduled_at: d.toISOString(),
            status: 'Needs Draft',
            target_platform: p,
            media_type: m,
            image_status: img ? 'Pending' : 'Not Requested',
            video_status: vid ? 'Pending' : 'Not Requested',
            video_duration_seconds: vid ? 5 : 8,
            updated_at: new Date().toISOString()
          });
        });
      });
    });

    try {
      await api('content_queue', { method: 'POST', body: rows });
      this.store.showToast(`${rows.length} rows created.`);
      const CFG = getCfg();
      if (CFG.hook) {
        fetch(CFG.hook, { method: 'POST', body: JSON.stringify({ source: 'console', count: rows.length }) }).catch(()=>{});
      }
      this.selectedBrands = [];
      this.media = { facebook: 'Not used', instagram: 'Not used', linkedin: 'Not used' };
      this.store.refreshData();
    } catch (e: any) {
      this.store.showToast('Error: ' + e.message);
    }
  }
}
