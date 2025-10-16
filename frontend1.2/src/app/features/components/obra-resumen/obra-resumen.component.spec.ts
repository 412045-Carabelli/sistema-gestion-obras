import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ObraResumenComponent} from './obra-resumen.component';

describe('ObraResumenComponent', () => {
  let component: ObraResumenComponent;
  let fixture: ComponentFixture<ObraResumenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObraResumenComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ObraResumenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
