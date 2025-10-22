import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearEvaluacion } from './crear-evaluacion.component';

describe('CrearEvaluacion', () => {
  let component: CrearEvaluacion;
  let fixture: ComponentFixture<CrearEvaluacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearEvaluacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearEvaluacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
