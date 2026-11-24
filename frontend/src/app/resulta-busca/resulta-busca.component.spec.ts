import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ResultaBuscaComponent } from './resulta-busca.component';

describe('ResultaBuscaComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ResultaBuscaComponent],
      providers: [provideRouter([{ path: '**', children: [] }]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('deve ser criado', () => {
    const fixture = TestBed.createComponent(ResultaBuscaComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
