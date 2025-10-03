import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObraPresupuestoComponent } from './obra-presupuesto.component';

describe('ObraPresupuestoComponent', () => {
  let component: ObraPresupuestoComponent;
  let fixture: ComponentFixture<ObraPresupuestoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObraPresupuestoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObraPresupuestoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
