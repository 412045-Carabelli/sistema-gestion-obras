import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObraTareasComponent } from './obra-tareas.component';

describe('ObraTareasComponent', () => {
  let component: ObraTareasComponent;
  let fixture: ComponentFixture<ObraTareasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObraTareasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObraTareasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
