import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Retroalimentacion } from './retroalimentacion.component';

describe('Retroalimentacion', () => {
  let component: Retroalimentacion;
  let fixture: ComponentFixture<Retroalimentacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Retroalimentacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Retroalimentacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
