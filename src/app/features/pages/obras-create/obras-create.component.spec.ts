import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObrasCreateComponent } from './obras-create.component';

describe('ObrasCreateComponent', () => {
  let component: ObrasCreateComponent;
  let fixture: ComponentFixture<ObrasCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObrasCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObrasCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
