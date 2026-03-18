import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-backups-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './backups-layout.component.html',
  styleUrls: ['./backups-layout.component.css']
})
export class BackupsLayoutComponent {}
