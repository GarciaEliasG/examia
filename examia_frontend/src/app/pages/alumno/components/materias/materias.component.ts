import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';

interface Course {
  name: string;
  code: string;
  teacher: string;
  classroom: string;
  schedule: string;
  status: string;
  hasActiveEvaluation: boolean;
}

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './materias.component.html',
  styleUrls: ['./materias.component.css']
})
export class Materias {
  searchTerm: string = '';
  selectedTurn: string = '';
  selectedStatus: string = '';

  courses: Course[] = [
    {
      name: 'Matemática I',
      code: 'MAT123',
      teacher: 'Prof. García',
      classroom: 'Aula 204',
      schedule: 'Mañana',
      status: 'Con evaluación activa',
      hasActiveEvaluation: true
    },
    {
      name: 'Química',
      code: 'QUI221',
      teacher: 'Lic. De Cia',
      classroom: 'Laboratorio',
      schedule: 'Tarde',
      status: 'Sin evaluación',
      hasActiveEvaluation: false
    },
    {
      name: 'Programación',
      code: 'PRO310',
      teacher: 'Ing. Badino',
      classroom: 'Lab 3',
      schedule: 'Noche',
      status: 'Con evaluación activa',
      hasActiveEvaluation: true
    }
  ];

  constructor(private router: Router) {}

  get filteredCourses(): Course[] {
    return this.courses.filter(course => {
      const matchesSearch = !this.searchTerm || 
        course.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        course.teacher.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesTurn = !this.selectedTurn || course.schedule === this.selectedTurn;
      const matchesStatus = !this.selectedStatus || course.status === this.selectedStatus;
      
      return matchesSearch && matchesTurn && matchesStatus;
    });
  }

  enterCourse(code: string) {
    localStorage.setItem('materia_codigo', code);
    this.router.navigate(['/alumno/evaluaciones']);
  }

  viewEvaluations() {
    this.router.navigate(['/alumno/evaluaciones']);
  }
}