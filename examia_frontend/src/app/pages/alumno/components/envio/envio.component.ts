import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Attachment {
  name: string;
  type: string;
  downloadUrl: string;
}

@Component({
  selector: 'app-envio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './envio.component.html',
  styleUrls: ['./envio.component.css','../evaluaciones/evaluaciones.component.css']
})
export class Envio implements OnInit {
  evaluationId: string = '';
  attachments: Attachment[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.evaluationId = this.route.snapshot.paramMap.get('id') || '';
    this.loadAttachments();
  }

  loadAttachments() {
    this.attachments = [
      { name: 'documento_final.pdf', type: 'pdf', downloadUrl: '#' },
      { name: 'diagrama_clases.png', type: 'image', downloadUrl: '#' }
    ];
  }

  getFileIcon(type: string): string {
    switch (type) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      default: return '📎';
    }
  }

  volver() {
    this.router.navigate(['/alumno/evaluaciones']);
  }
}