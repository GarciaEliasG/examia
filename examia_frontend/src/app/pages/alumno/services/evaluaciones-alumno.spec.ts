import { TestBed } from '@angular/core/testing';

import { EvaluacionesAlumno } from './evaluaciones-alumno';

describe('EvaluacionesAlumno', () => {
  let service: EvaluacionesAlumno;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EvaluacionesAlumno);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
