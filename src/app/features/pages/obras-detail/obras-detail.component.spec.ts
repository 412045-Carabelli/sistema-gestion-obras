import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObrasDetailComponent } from './obras-detail.component';

describe('ObrasDetailComponent', () => {
  let component: ObrasDetailComponent;
  let fixture: ComponentFixture<ObrasDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObrasDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObrasDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
