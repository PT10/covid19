import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IndiaDeathCasesComponent } from './india-death-cases.component';

describe('IndiaDeathCasesComponent', () => {
  let component: IndiaDeathCasesComponent;
  let fixture: ComponentFixture<IndiaDeathCasesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IndiaDeathCasesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IndiaDeathCasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
