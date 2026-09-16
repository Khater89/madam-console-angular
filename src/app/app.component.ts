import { Component, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StoreService } from './store.service';
import { OrderComponent } from './components/order.component';
import { QueueComponent } from './components/queue.component';
import { ReviewComponent } from './components/review.component';
import { PublishComponent } from './components/publish.component';
import { DoneComponent } from './components/done.component';
import { SetupComponent } from './components/setup.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule,
    OrderComponent, 
    QueueComponent, 
    ReviewComponent, 
    PublishComponent, 
    DoneComponent, 
    SetupComponent
  ],
  template: `
    <div class="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 transition-colors duration-300">
      
      <!-- Sidebar Navigation (Drawer) -->
      <aside class="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm z-10 transition-colors duration-300">
        <div class="px-6 py-8">
          <div class="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1 flex items-center gap-2">
            <mat-icon class="!text-lg">auto_awesome</mat-icon> Madama Group
          </div>
          <h1 class="text-2xl font-bold tracking-tight">Console</h1>
        </div>
        
        <nav class="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-4 px-4">Marketing</div>

          <button (click)="setView('order')"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all font-medium text-sm text-left"
                  [class.bg-indigo-50]="view === 'order'" [class.text-indigo-700]="view === 'order'"
                  [class.text-slate-600]="view !== 'order'" [class.hover:bg-slate-100]="view !== 'order'">
            <mat-icon>add_circle</mat-icon> New order
          </button>
          
          <button (click)="setView('queue')"
                  class="w-full flex items-center justify-between px-4 py-3 rounded-full transition-all font-medium text-sm text-left"
                  [class.bg-indigo-50]="view === 'queue'" [class.text-indigo-700]="view === 'queue'"
                  [class.text-slate-600]="view !== 'queue'" [class.hover:bg-slate-100]="view !== 'queue'">
            <div class="flex items-center gap-3"><mat-icon>hourglass_empty</mat-icon> Queue</div>
            <span *ngIf="store.counts().queue" class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">{{ store.counts().queue }}</span>
          </button>
          
          <button (click)="setView('review')"
                  class="w-full flex items-center justify-between px-4 py-3 rounded-full transition-all font-medium text-sm text-left"
                  [class.bg-indigo-50]="view === 'review'" [class.text-indigo-700]="view === 'review'"
                  [class.text-slate-600]="view !== 'review'" [class.hover:bg-slate-100]="view !== 'review'">
            <div class="flex items-center gap-3"><mat-icon>edit_note</mat-icon> Review & edit</div>
            <span *ngIf="store.counts().review" class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">{{ store.counts().review }}</span>
          </button>
          
          <button (click)="setView('publish')"
                  class="w-full flex items-center justify-between px-4 py-3 rounded-full transition-all font-medium text-sm text-left"
                  [class.bg-indigo-50]="view === 'publish'" [class.text-indigo-700]="view === 'publish'"
                  [class.text-slate-600]="view !== 'publish'" [class.hover:bg-slate-100]="view !== 'publish'">
            <div class="flex items-center gap-3"><mat-icon>send_time_extension</mat-icon> Publish</div>
            <span *ngIf="store.counts().publish" class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">{{ store.counts().publish }}</span>
          </button>
          
          <button (click)="setView('done')"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all font-medium text-sm text-left"
                  [class.bg-indigo-50]="view === 'done'" [class.text-indigo-700]="view === 'done'"
                  [class.text-slate-600]="view !== 'done'" [class.hover:bg-slate-100]="view !== 'done'">
            <mat-icon>done_all</mat-icon> Published
          </button>
          
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-8 px-4 border-t border-slate-100 pt-6">Configuration</div>
          
          <button (click)="setView('setup')"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all font-medium text-sm text-left mb-6"
                  [class.bg-indigo-50]="view === 'setup'" [class.text-indigo-700]="view === 'setup'"
                  [class.text-slate-600]="view !== 'setup'" [class.hover:bg-slate-100]="view !== 'setup'">
            <mat-icon>settings_ethernet</mat-icon> Connection
          </button>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto relative">
        <div class="max-w-6xl mx-auto p-8 lg:p-12">
          <app-order *ngIf="view === 'order'"></app-order>
          <app-queue *ngIf="view === 'queue'"></app-queue>
          <app-review *ngIf="view === 'review'"></app-review>
          <app-publish *ngIf="view === 'publish'"></app-publish>
          <app-done *ngIf="view === 'done'"></app-done>
          <app-setup *ngIf="view === 'setup'" (onSaved)="setView('order')"></app-setup>
        </div>
        
        <!-- Toast Snackbar -->
        <div *ngIf="store.toastMsg()" class="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-full font-medium text-sm shadow-xl z-50 flex items-center gap-3 transition-all animate-fade-in">
          <mat-icon>info</mat-icon>
          {{ store.toastMsg() }}
        </div>
      </main>
    </div>
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
  `]
})
export class AppComponent implements OnInit {
  view = 'order';

  constructor(public store: StoreService) {}

  ngOnInit() {}

  setView(v: string) {
    this.view = v;
  }
}
