import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Instrucciones } from './instrucciones.component';

describe('Instrucciones', () => {
  let component: Instrucciones;
  let fixture: ComponentFixture<Instrucciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Instrucciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Instrucciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
