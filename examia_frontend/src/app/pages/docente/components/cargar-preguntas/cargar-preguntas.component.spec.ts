import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargarPreguntas } from './cargar-preguntas.component';

describe('CargarPreguntas', () => {
  let component: CargarPreguntas;
  let fixture: ComponentFixture<CargarPreguntas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargarPreguntas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CargarPreguntas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
