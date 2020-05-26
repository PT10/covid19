import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Utils } from '../../utils';
import { ClipboardService } from 'ngx-clipboard';

@Component({
  selector: 'app-embed',
  templateUrl: './embed.component.html',
  styleUrls: ['./embed.component.css']
})
export class EmbedComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
  private clipboardService: ClipboardService,
  private dialogRef: MatDialogRef<EmbedComponent>) { }

  link = '';
  ngOnInit() {
    if (this.data) {
      this.link = Utils.getAbsoluteUrl();
      this.link  += '?&embed=true&view=' + this.data.view + '&date=' + Utils.formatDateForFileName(this.data.date) 
    }
  }

  copy() {
    this.clipboardService.copyFromContent(this.link);
    this.dialogRef.close();
  }

  close() {
    this.dialogRef.close();
  }

}
