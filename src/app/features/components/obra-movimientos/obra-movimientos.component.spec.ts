import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObraMovimientosComponent } from './obra-movimientos.component';

describe('ObraMovimientosComponent', () => {
  let component: ObraMovimientosComponent;
  let fixture: ComponentFixture<ObraMovimientosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObraMovimientosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObraMovimientosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
