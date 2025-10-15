import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-obra-report',
  imports: [],
  templateUrl: './obra-report.component.html',
  styleUrl: './obra-report.component.css'
})
export class ObraReportComponent {
  @Input() obraId!: number | undefined;

}
