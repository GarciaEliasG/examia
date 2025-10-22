import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Respuestas } from './respuestas.component';

describe('Respuestas', () => {
  let component: Respuestas;
  let fixture: ComponentFixture<Respuestas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Respuestas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Respuestas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
