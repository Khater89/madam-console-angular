import { Component, signal, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StoreService } from './store.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="flex flex-col h-[500px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center">
        <mat-icon class="text-indigo-600 mr-2">smart_toy</mat-icon>
        <h3 class="font-medium text-slate-800">AI Assistant</h3>
      </div>
      
      <!-- Thread -->
      <div #scrollContainer class="flex-1 overflow-y-auto p-4 space-y-4">
        @if (messages().length === 0) {
          <div class="h-full flex flex-col items-center justify-center text-slate-400">
            <mat-icon class="opacity-50 mb-2 !w-12 !h-12 !text-5xl">forum</mat-icon>
            <p>How can I help you today?</p>
          </div>
        }
        
        @for (msg of messages(); track $index) {
          <div [ngClass]="{'flex justify-end': msg.role === 'user', 'flex justify-start': msg.role === 'model'}">
            <div [ngClass]="{
              'max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed': true,
              'bg-indigo-600 text-white rounded-br-sm': msg.role === 'user',
              'bg-slate-100 text-slate-800 rounded-bl-sm': msg.role === 'model'
            }">
              {{ msg.text }}
            </div>
          </div>
        }
        
        @if (isGenerating()) {
          <div class="flex justify-start">
            <div class="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3 bg-slate-100 text-slate-500">
              <mat-spinner diameter="20" strokeWidth="2"></mat-spinner>
            </div>
          </div>
        }
      </div>
      
      <!-- Input -->
      <div class="p-3 border-t border-slate-100 bg-white">
        <div class="flex items-center gap-2">
          <input 
            type="text" 
            [(ngModel)]="currentInput" 
            (keyup.enter)="sendMessage()"
            [disabled]="isGenerating()"
            placeholder="Type a message..." 
            class="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-transparent focus:border-indigo-300 focus:bg-white focus:outline-none transition-colors disabled:opacity-50 text-sm"
          />
          <button mat-icon-button color="primary" (click)="sendMessage()" [disabled]="!currentInput.trim() || isGenerating()">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  
  messages = signal<ChatMessage[]>([]);
  isGenerating = signal<boolean>(false);
  currentInput = '';
  
  private http = inject(HttpClient);
  
  ngAfterViewChecked() {
    this.scrollToBottom();
  }
  
  private scrollToBottom(): void {
    if (this.scrollContainer) {
      try {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      } catch(err) { }
    }
  }

  async sendMessage() {
    const text = this.currentInput.trim();
    if (!text || this.isGenerating()) return;
    
    // Format history for the Gemini API (roles must be 'user' or 'model')
    const historyForApi = this.messages().map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));
    
    // Add user message to UI
    this.messages.update(m => [...m, { role: 'user', text }]);
    this.currentInput = '';
    this.isGenerating.set(true);
    
    try {
      const response = await firstValueFrom(this.http.post<{text: string}>('/api/chat', {
        message: text,
        history: historyForApi
      }));
      
      if (response && response.text) {
        this.messages.update(m => [...m, { role: 'model', text: response.text }]);
      }
    } catch (error) {
      console.error('Failed to send message', error);
      this.messages.update(m => [...m, { 
        role: 'model', 
        text: 'Sorry, I encountered an error while processing your request.' 
      }]);
    } finally {
      this.isGenerating.set(false);
    }
  }
}
