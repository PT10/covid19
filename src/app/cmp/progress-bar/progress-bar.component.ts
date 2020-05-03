import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.css']
})
export class ProgressBarComponent {

  @Input()
  hidden: boolean = false;

  @Input()
  color: string = 'primary';

  @Input()
  mode: string = 'indeterminate';

  @Input()
  value: number = 50;

  @Input()
  bufferValue: number = 50;

  constructor() { }
}
