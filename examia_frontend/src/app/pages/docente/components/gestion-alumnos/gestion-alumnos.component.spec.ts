import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionAlumnos } from './gestion-alumnos.component';

describe('GestionAlumnos', () => {
  let component: GestionAlumnos;
  let fixture: ComponentFixture<GestionAlumnos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionAlumnos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionAlumnos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
