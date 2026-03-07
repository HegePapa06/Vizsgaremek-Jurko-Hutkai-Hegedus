import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Vasarlas } from './vasarlas';

describe('Vasarlas', () => {
  let component: Vasarlas;
  let fixture: ComponentFixture<Vasarlas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Vasarlas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Vasarlas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
