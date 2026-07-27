import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface SseEvent {
  type: string;
  data: any;
  timestamp: number;
}

@Injectable()
export class SseService {
  private subjects = new Map<string, Subject<SseEvent>>();

  getSubject(matchId: string): Subject<SseEvent> {
    if (!this.subjects.has(matchId)) {
      this.subjects.set(matchId, new Subject<SseEvent>());
    }
    return this.subjects.get(matchId)!;
  }

  emit(matchId: string, event: SseEvent) {
    const subject = this.subjects.get(matchId);
    if (subject) {
      try {
        subject.next(event);
      } catch {
      }
    }
  }
}
