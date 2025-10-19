import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealizarEvaluacion } from './realizar-evaluacion.component';

describe('RealizarEvaluacion', () => {
  let component: RealizarEvaluacion;
  let fixture: ComponentFixture<RealizarEvaluacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RealizarEvaluacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RealizarEvaluacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
