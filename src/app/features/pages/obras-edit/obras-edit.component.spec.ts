import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObrasEditComponent } from './obras-edit.component';

describe('ObrasEditComponent', () => {
  let component: ObrasEditComponent;
  let fixture: ComponentFixture<ObrasEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObrasEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObrasEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
