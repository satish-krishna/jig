import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { AppShell } from './shell/app-shell';

@Component({
  selector: 'app-root',
  imports: [AppShell],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('jig');
}
