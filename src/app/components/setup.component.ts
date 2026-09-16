import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { StoreService } from '../store.service';
import { CFG, saveCfg, DEFAULTS, getCfg } from '../config';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <section class="max-w-2xl mx-auto">
      <div class="mb-8">
        <h2 class="text-3xl font-bold tracking-tight text-slate-900">Connection</h2>
        <p class="text-slate-500 mt-2">Configuration is saved securely in your browser's local storage.</p>
      </div>

      <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 flex flex-col gap-6">
        <div class="flex items-center gap-3 mb-2 border-b border-slate-100 pb-4">
          <div class="bg-indigo-100 text-indigo-700 p-2 rounded-xl flex"><mat-icon>api</mat-icon></div>
          <h2 class="text-xl font-semibold text-slate-900">Supabase API Details</h2>
        </div>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-semibold text-slate-700">Supabase URL</span>
          <input [(ngModel)]="url" placeholder="https://xyz.supabase.co" class="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-mono text-sm" />
        </label>
        
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-semibold text-slate-700">Publishable Key</span>
          <input [(ngModel)]="key" type="password" placeholder="eyJ..." class="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-mono text-sm" />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-semibold text-slate-700">Engine Webhook URL (Make.com)</span>
          <input [(ngModel)]="hook" class="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-mono text-sm" />
        </label>
        
        <div class="grid grid-cols-2 gap-4 mt-2">
          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-semibold text-slate-700">Your Name</span>
            <input [(ngModel)]="who" class="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-semibold text-slate-700">Telegram Slug</span>
            <input [(ngModel)]="fnTg" class="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-mono text-sm" />
          </label>
          <label class="flex flex-col gap-1.5 col-span-2">
            <span class="text-sm font-semibold text-slate-700">Rewrite Function Slug</span>
            <input [(ngModel)]="fnRw" class="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-mono text-sm" />
          </label>
        </div>

        <div *ngIf="note" class="p-4 rounded-xl text-sm font-medium border"
             [class.bg-rose-50]="note.type === 'bad'" [class.text-rose-700]="note.type === 'bad'" [class.border-rose-200]="note.type === 'bad'"
             [class.bg-emerald-50]="note.type === 'ok'" [class.text-emerald-700]="note.type === 'ok'" [class.border-emerald-200]="note.type === 'ok'">
          <div class="flex items-center gap-2">
            <mat-icon class="!text-[18px] !w-[18px] !h-[18px]">{{ note.type === 'bad' ? 'error' : 'check_circle' }}</mat-icon> {{ note.msg }}
          </div>
        </div>

        <div class="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 mt-4">
          <button class="px-6 py-3 rounded-full font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2" (click)="useBuiltIn()">
            <mat-icon>settings_backup_restore</mat-icon> Use Built-in defaults
          </button>
          <button class="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2" (click)="handleSave()">
            <mat-icon>save</mat-icon> Save & Connect
          </button>
        </div>
      </div>
    </section>
  `
})
export class SetupComponent {
  @Output() onSaved = new EventEmitter<void>();

  url = CFG.url || '';
  key = CFG.key || '';
  hook = CFG.hook || '';
  who = CFG.who || '';
  fnTg = CFG.fn_telegram || '';
  fnRw = CFG.fn_rewrite || '';
  note: { type: string, msg: string } | null = null;

  constructor(private store: StoreService) {}

  async handleSave() {
    saveCfg({ url: this.url, key: this.key, hook: this.hook, who: this.who, fn_telegram: this.fnTg, fn_rewrite: this.fnRw });
    if (/^sb_secret_/.test(this.key)) {
      this.note = { type: 'bad', msg: 'That is the secret key. Use the publishable one.' };
      return;
    }
    await this.store.refreshData();
    this.note = { type: 'ok', msg: 'Settings saved and connected successfully!' };
    setTimeout(() => {
      this.onSaved.emit();
    }, 1500);
  }

  useBuiltIn() {
    localStorage.removeItem('madama.cfg');
    this.url = DEFAULTS.url;
    this.key = DEFAULTS.key;
    this.hook = DEFAULTS.hook;
    this.who = DEFAULTS.who;
    this.fnTg = DEFAULTS.fn_telegram;
    this.fnRw = DEFAULTS.fn_rewrite;
    saveCfg(DEFAULTS);
    this.store.refreshData();
    this.note = { type: 'ok', msg: 'Restored defaults.' };
    setTimeout(() => {
      this.onSaved.emit();
    }, 1000);
  }
}
