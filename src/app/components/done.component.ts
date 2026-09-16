import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StoreService } from '../store.service';
import { PLATNAME } from '../config';

@Component({
  selector: 'app-done',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="max-w-6xl mx-auto">
      <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold tracking-tight text-slate-900">Published</h2>
          <p class="text-slate-500 mt-2">History of all successfully published marketing posts.</p>
        </div>
        <button class="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 font-medium rounded-full hover:bg-slate-50 transition-all shadow-sm" (click)="store.refreshData()">
          <mat-icon class="!text-[20px] !w-[20px] !h-[20px]">refresh</mat-icon> Refresh
        </button>
      </div>

      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div *ngIf="!done().length" class="p-12 text-center flex flex-col items-center">
          <div class="bg-slate-50 text-slate-400 p-4 rounded-full mb-4 inline-flex"><mat-icon class="!text-3xl !w-8 !h-8">history</mat-icon></div>
          <h3 class="text-lg font-medium text-slate-900">No history yet</h3>
          <p class="text-slate-500 mt-1">Published posts will appear here.</p>
        </div>
        
        <div *ngIf="done().length" class="overflow-x-auto">
          <table class="w-full text-left border-collapse whitespace-nowrap text-sm">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100">
                <th class="py-4 px-6 font-semibold text-slate-700">Company</th>
                <th class="py-4 px-6 font-semibold text-slate-700">Service</th>
                <th class="py-4 px-6 font-semibold text-slate-700">Platform</th>
                <th class="py-4 px-6 font-semibold text-slate-700">Status</th>
                <th class="py-4 px-6 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let r of done()" class="hover:bg-slate-50/50 transition-colors">
                <td class="py-4 px-6 font-medium text-slate-900">{{ getBrandName(r.brand_id) }}</td>
                <td class="py-4 px-6 text-slate-600">{{ r.content_pillar }}</td>
                <td class="py-4 px-6 text-slate-600 flex items-center gap-2">
                  <mat-icon class="!text-[18px] !w-[18px] !h-[18px] text-slate-400">campaign</mat-icon> {{ platName(r.target_platform) }}
                </td>
                <td class="py-4 px-6">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <mat-icon class="!text-[14px] !w-[14px] !h-[14px] mr-1">done_all</mat-icon> {{ r.status }}
                  </span>
                </td>
                <td class="py-4 px-6 text-right">
                  <button class="inline-flex items-center justify-center p-2 text-rose-500 hover:text-rose-700 font-medium rounded-lg hover:bg-rose-50 transition-all" (click)="store.deleteRow(r.id)" title="Delete">
                    <mat-icon class="!text-[20px] !w-[20px] !h-[20px]">delete</mat-icon>
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
export class DoneComponent {
  done = computed(() => this.store.allRows().filter(r => this.store.stageOf(r) === 'done'));

  constructor(public store: StoreService) {}

  getBrandName(id: string) {
    const b = this.store.brands().find(br => br.brand_id === id);
    return b ? (b.company_name || id) : id;
  }

  platName(p: string) {
    return PLATNAME[p] || p;
  }
}
