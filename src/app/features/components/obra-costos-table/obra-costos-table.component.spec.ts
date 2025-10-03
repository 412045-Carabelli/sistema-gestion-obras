import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObraCostosTableComponent } from './obra-costos-table.component';

describe('ObraCostosTableComponent', () => {
  let component: ObraCostosTableComponent;
  let fixture: ComponentFixture<ObraCostosTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObraCostosTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObraCostosTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
