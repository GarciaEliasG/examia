import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelAlumno } from './panel-alumno.component';

describe('PanelAlumno', () => {
  let component: PanelAlumno;
  let fixture: ComponentFixture<PanelAlumno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelAlumno]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelAlumno);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
