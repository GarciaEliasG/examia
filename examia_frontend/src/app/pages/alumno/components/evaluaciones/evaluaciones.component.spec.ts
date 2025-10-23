import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamenesAlumno } from './evaluaciones.component';

describe('Evaluaciones', () => {
  let component: ExamenesAlumno;
  let fixture: ComponentFixture<ExamenesAlumno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamenesAlumno]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamenesAlumno);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
