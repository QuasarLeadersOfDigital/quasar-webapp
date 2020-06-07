import { TestBed } from '@angular/core/testing';

import { VideochatService } from './videochat.service';

describe('VideochatService', () => {
  let service: VideochatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideochatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
