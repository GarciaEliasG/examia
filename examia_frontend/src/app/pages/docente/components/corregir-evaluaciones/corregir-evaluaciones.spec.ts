import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorregirEvaluaciones } from './corregir-evaluaciones';

describe('CorregirEvaluaciones', () => {
  let component: CorregirEvaluaciones;
  let fixture: ComponentFixture<CorregirEvaluaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorregirEvaluaciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorregirEvaluaciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
