import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ObraReportComponent} from './obra-report.component';

describe('ObraReportComponent', () => {
  let component: ObraReportComponent;
  let fixture: ComponentFixture<ObraReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObraReportComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ObraReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
