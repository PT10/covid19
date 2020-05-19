import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IndiaConfirmedCasesComponent } from './india-confirmed-cases.component';

describe('IndiaConfirmedCasesComponent', () => {
  let component: IndiaConfirmedCasesComponent;
  let fixture: ComponentFixture<IndiaConfirmedCasesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IndiaConfirmedCasesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IndiaConfirmedCasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
