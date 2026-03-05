import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Oktatok } from './oktatok';

describe('Oktatok', () => {
  let component: Oktatok;
  let fixture: ComponentFixture<Oktatok>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Oktatok]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Oktatok);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
