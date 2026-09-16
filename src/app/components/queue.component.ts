import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StoreService } from '../store.service';
import { PLATNAME } from '../config';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="max-w-6xl mx-auto">
      <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold tracking-tight text-slate-900">Queue</h2>
          <p class="text-slate-500 mt-2">Posts that are currently in production.</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 font-medium rounded-full hover:bg-slate-50 transition-all shadow-sm" (click)="store.refreshData()">
            <mat-icon class="!text-[20px] !w-[20px] !h-[20px]">refresh</mat-icon> Refresh
          </button>
          <button *ngIf="drafts().length > 0" class="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 font-medium rounded-full hover:bg-rose-100 transition-all border border-rose-200" (click)="dropDrafts()">
            <mat-icon class="!text-[20px] !w-[20px] !h-[20px]">delete_sweep</mat-icon> Delete unstarted drafts ({{drafts().length}})
          </button>
        </div>
      </div>
      
      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div *ngIf="!queue().length" class="p-12 text-center flex flex-col items-center">
          <div class="bg-slate-50 text-slate-400 p-4 rounded-full mb-4 inline-flex"><mat-icon class="!text-3xl !w-8 !h-8">inbox</mat-icon></div>
          <h3 class="text-lg font-medium text-slate-900">Nothing in production</h3>
          <p class="text-slate-500 mt-1">There are no posts currently waiting in the queue.</p>
        </div>
        
        <div *ngIf="queue().length" class="overflow-x-auto">
          <table class="w-full text-left border-collapse whitespace-nowrap text-sm">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100">
                <th class="py-4 px-6 font-semibold text-slate-700">Company</th>
                <th class="py-4 px-6 font-semibold text-slate-700">Platform</th>
                <th class="py-4 px-6 font-semibold text-slate-700">Status</th>
                <th class="py-4 px-6 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let r of queue()" class="hover:bg-slate-50/50 transition-colors">
                <td class="py-4 px-6 font-medium text-slate-900">{{ getBrandName(r.brand_id) }}</td>
                <td class="py-4 px-6 text-slate-600 flex items-center gap-2">
                  <mat-icon class="!text-[18px] !w-[18px] !h-[18px] text-slate-400">campaign</mat-icon> {{ platName(r.target_platform) }}
                </td>
                <td class="py-4 px-6">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                        [class.bg-amber-100]="r.status === 'Needs Draft'" [class.text-amber-800]="r.status === 'Needs Draft'"
                        [class.bg-indigo-100]="r.status !== 'Needs Draft'" [class.text-indigo-800]="r.status !== 'Needs Draft'">
                    {{ r.status }}
                  </span>
                </td>
                <td class="py-4 px-6 text-right">
                  <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 font-medium rounded-lg hover:bg-rose-50 transition-all text-xs" (click)="store.deleteRow(r.id)">
                    <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">delete</mat-icon> Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `
})
export class QueueComponent {
  queue = computed(() => this.store.allRows().filter(r => this.store.stageOf(r) === 'queue'));
  drafts = computed(() => this.queue().filter(r => r.status === 'Needs Draft' && !r.image_url && !r.video_url));

  constructor(public store: StoreService) {}

  getBrandName(id: string) {
    const b = this.store.brands().find(br => br.brand_id === id);
    return b ? (b.company_name || id) : id;
  }

  platName(p: string) {
    return PLATNAME[p] || p;
  }

  async dropDrafts() {
    if (!confirm(`Delete all ${this.drafts().length} unstarted draft(s)?`)) return;
    for (const d of this.drafts()) {
      await this.store.deleteRow(d.id);
    }
  }
}
