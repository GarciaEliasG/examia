import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginAlumno } from './login-alumno.component';

describe('LoginAlumno', () => {
  let component: LoginAlumno;
  let fixture: ComponentFixture<LoginAlumno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginAlumno]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginAlumno);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
