import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StoreService } from '../store.service';
import { PLATNAME, api } from '../config';

@Component({
  selector: 'app-publish',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="max-w-6xl mx-auto">
      <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold tracking-tight text-slate-900">Pending publishing</h2>
          <p class="text-slate-500 mt-2">Approved posts ready to be scheduled or published manually.</p>
        </div>
        <button class="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 font-medium rounded-full hover:bg-slate-50 transition-all shadow-sm" (click)="store.refreshData()">
          <mat-icon class="!text-[20px] !w-[20px] !h-[20px]">refresh</mat-icon> Refresh
        </button>
      </div>

      <div *ngIf="!publish().length" class="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 text-center flex flex-col items-center">
        <div class="bg-slate-50 text-slate-400 p-4 rounded-full mb-4 inline-flex"><mat-icon class="!text-3xl !w-8 !h-8">send_time_extension</mat-icon></div>
        <h3 class="text-lg font-medium text-slate-900">Nothing to publish</h3>
        <p class="text-slate-500 mt-1">Approve items in Review to see them here.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div *ngFor="let r of publish()" class="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 flex flex-col gap-6">
          <header class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <div class="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-1">
                <mat-icon class="!text-[16px] !w-[16px] !h-[16px] text-indigo-500">storefront</mat-icon> {{ getBrandName(r.brand_id) }}
                <span class="text-slate-300">•</span>
                <span class="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">{{ platName(r.target_platform) }}</span>
              </div>
              <div class="text-xs font-mono text-slate-400 mt-2">{{ r.id }}</div>
            </div>
            <div class="flex gap-2 items-center">
              <span class="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border border-emerald-100">
                <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">check_circle</mat-icon> {{ r.status }}
              </span>
            </div>
          </header>
          
          <pre class="w-full rounded-2xl border border-slate-100 bg-slate-50 p-5 text-slate-700 text-sm font-sans leading-relaxed min-h-[120px] whitespace-pre-wrap overflow-y-auto max-h-48">{{ copyFor(r) }}</pre>

          <div class="flex flex-col sm:flex-row gap-3 pt-4 mt-auto">
            <button (click)="publishNow(r.id)" class="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-all shadow-sm">
              <mat-icon class="!text-[20px] !w-[20px] !h-[20px]">publish</mat-icon> Publish now
            </button>
            <button (click)="store.deleteRow(r.id)" class="flex items-center justify-center gap-2 px-6 py-2.5 text-rose-600 font-medium rounded-full hover:bg-rose-50 transition-all border border-rose-100 sm:w-auto w-full">
              <mat-icon class="!text-[20px] !w-[20px] !h-[20px]">delete</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </section>
  `
})
export class PublishComponent {
  publish = computed(() => this.store.allRows().filter(r => this.store.stageOf(r) === 'publish'));

  constructor(public store: StoreService) {}

  getBrandName(id: string) {
    const b = this.store.brands().find(br => br.brand_id === id);
    return b ? (b.company_name || id) : id;
  }

  platName(p: string) {
    return PLATNAME[p] || p;
  }

  copyFor(r: any) {
    const t = (r.target_platform || '').toLowerCase();
    return t === 'facebook' ? r.generated_facebook : t === 'instagram' ? r.generated_instagram : r.generated_linkedin;
  }

  async publishNow(id: string) {
    if (!confirm('Publish this post now?')) return;
    try {
      await api(`content_queue?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: { scheduled_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      });
      this.store.showToast('Queued for publishing');
      this.store.refreshData();
    } catch (e: any) {
      this.store.showToast('Failed: ' + e.message);
    }
  }
}
