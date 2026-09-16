import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { StoreService } from '../store.service';
import { PLATNAME, api, callFn, getCfg } from '../config';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <section class="max-w-4xl mx-auto">
      <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold tracking-tight text-slate-900">Review & edit</h2>
          <p class="text-slate-500 mt-2">Approve generated copy or ask the AI to rewrite it.</p>
        </div>
        <button class="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 font-medium rounded-full hover:bg-slate-50 transition-all shadow-sm" (click)="store.refreshData()">
          <mat-icon class="!text-[20px] !w-[20px] !h-[20px]">refresh</mat-icon> Refresh
        </button>
      </div>

      <div *ngIf="!review().length" class="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 text-center flex flex-col items-center">
        <div class="bg-slate-50 text-slate-400 p-4 rounded-full mb-4 inline-flex"><mat-icon class="!text-3xl !w-8 !h-8">fact_check</mat-icon></div>
        <h3 class="text-lg font-medium text-slate-900">All caught up</h3>
        <p class="text-slate-500 mt-1">No drafts are currently waiting for your review.</p>
      </div>

      <div class="space-y-6">
        <div *ngFor="let r of review()" class="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 flex flex-col gap-6">
          
          <header class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <div class="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-1">
                <mat-icon class="!text-[16px] !w-[16px] !h-[16px] text-indigo-500">storefront</mat-icon> {{ getBrandName(r.brand_id) }}
                <span class="text-slate-300">•</span>
                <span class="text-slate-500">{{ r.content_pillar }}</span>
                <span class="text-slate-300">•</span>
                <span class="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">{{ platName(r.target_platform) }}</span>
              </div>
              <div class="text-xs font-mono text-slate-400 mt-2">{{ r.id }}</div>
            </div>
            <div class="flex gap-2 items-center">
              <span class="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"><mat-icon class="!text-[14px] !w-[14px] !h-[14px]">perm_media</mat-icon> {{ r.media_type }}</span>
            </div>
          </header>
          
          <textarea [ngModel]="copyFor(r)" (ngModelChange)="setCopy(r.id, $event)"
                    class="w-full rounded-2xl border-slate-200 bg-slate-50 p-5 text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all min-h-[180px] resize-y font-sans leading-relaxed"></textarea>

          <div class="flex flex-col md:flex-row gap-4 items-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
            <div class="flex-1 relative w-full">
              <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400">auto_fix_high</mat-icon>
              <input [(ngModel)]="prompts[r.id]" placeholder="Tell the AI what to change..."
                     class="w-full rounded-full border-indigo-100 bg-white pl-12 pr-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-sm" />
            </div>
            <button (click)="handleRewrite(r)" class="flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-700 border border-indigo-200 font-medium rounded-full hover:bg-indigo-50 transition-all shadow-sm w-full md:w-auto">
              <mat-icon class="!text-[20px] !w-[20px] !h-[20px]">send</mat-icon> Rewrite with AI
            </button>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2 border-t border-slate-100 mt-2">
            <button (click)="store.deleteRow(r.id)" class="flex items-center justify-center gap-2 px-6 py-2.5 text-rose-600 font-medium rounded-full hover:bg-rose-50 transition-all sm:mr-auto">
              <mat-icon class="!text-[20px] !w-[20px] !h-[20px]">delete</mat-icon> Delete
            </button>
            <button (click)="handleSave(r, false)" class="flex items-center justify-center gap-2 px-6 py-2.5 text-slate-600 font-medium rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
              <mat-icon class="!text-[20px] !w-[20px] !h-[20px]">save</mat-icon> Save edits
            </button>
            <button (click)="handleSave(r, true)" class="flex items-center justify-center gap-2 px-8 py-2.5 bg-emerald-600 text-white font-medium rounded-full hover:bg-emerald-700 transition-all shadow-sm active:scale-[0.98]">
              <mat-icon class="!text-[20px] !w-[20px] !h-[20px]">check_circle</mat-icon> Approve
            </button>
          </div>
          
        </div>
      </div>
    </section>
  `
})
export class ReviewComponent {
  review = computed(() => this.store.allRows().filter(r => this.store.stageOf(r) === 'review'));
  prompts: Record<string, string> = {};
  copies: Record<string, string> = {};

  constructor(public store: StoreService) {}

  getBrandName(id: string) {
    const b = this.store.brands().find(br => br.brand_id === id);
    return b ? (b.company_name || id) : id;
  }

  platName(p: string) {
    return PLATNAME[p] || p;
  }

  copyFor(r: any) {
    if (this.copies[r.id] !== undefined) return this.copies[r.id];
    const t = (r.target_platform || '').toLowerCase();
    return t === 'facebook' ? r.generated_facebook : t === 'instagram' ? r.generated_instagram : r.generated_linkedin;
  }

  setCopy(id: string, text: string) {
    this.copies[id] = text;
  }

  async handleRewrite(r: any) {
    const p = this.prompts[r.id];
    if (!p) { this.store.showToast('Enter prompt first'); return; }
    try {
      const d = await callFn('rewrite', { id: r.id, instruction: p });
      this.copies[r.id] = d.rewritten;
      this.store.showToast('Rewritten');
    } catch (e: any) {
      this.store.showToast('Rewrite failed: ' + e.message);
    }
  }

  async handleSave(r: any, andApprove = false) {
    const text = this.copyFor(r);
    const t = (r.target_platform || '').toLowerCase();
    const field = t === 'facebook' ? 'generated_facebook' : t === 'instagram' ? 'generated_instagram' : 'generated_linkedin';
    
    const patch: any = { [field]: text, updated_at: new Date().toISOString() };
    if (andApprove) {
      patch.status = 'Approved';
      patch.approved_by = getCfg().who || 'console';
      patch.approved_at = new Date().toISOString();
    }
    
    try {
      await api(`content_queue?id=eq.${encodeURIComponent(r.id)}`, { method: 'PATCH', body: patch });
      if (andApprove) {
        this.store.showToast('Approved');
        this.store.refreshData();
      } else {
        this.store.showToast('Saved');
        callFn('telegram', { id: r.id, force: true }).catch(()=>{});
      }
    } catch (e: any) {
      this.store.showToast('Save failed: ' + e.message);
    }
  }
}
