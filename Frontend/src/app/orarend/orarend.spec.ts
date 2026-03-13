import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Orarend } from './orarend';

describe('Orarend', () => {
  let component: Orarend;
  let fixture: ComponentFixture<Orarend>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Orarend]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Orarend);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
