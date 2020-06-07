import { Injectable } from '@angular/core';
import {Observable, ReplaySubject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import { connect, ConnectOptions, LocalTrack, Room } from 'twilio-video';
import {environment} from '../../environments/environment';

interface AuthToken {
  token: string;
}

export interface NamedRoom {
  id: string;
  name: string;
  maxParticipants?: number;
  participantCount: number;
}

export type Rooms = NamedRoom[];

@Injectable({
  providedIn: 'root'
})
export class VideochatService {$roomsUpdated: Observable<boolean>;

  private roomBroadcast = new ReplaySubject<boolean>();

  constructor(private readonly http: HttpClient) {
    this.$roomsUpdated = this.roomBroadcast.asObservable();
  }

  private async getAuthToken() {
    const auth =
      await this.http
        .get<AuthToken>(`${environment.hubUri}/video/token`)
        .toPromise();

    return auth.token;
  }

  getAllRooms() {
    return this.http
      .get<Rooms>(`${environment.hubUri}/video/rooms`)
      .toPromise();
  }

  async joinOrCreateRoom(name: string, tracks: LocalTrack[]) {
    let room: Room = null;
    try {
      const token = await this.getAuthToken();
      room =
        await connect(
          token, {
            name,
            tracks,
            dominantSpeaker: true
          } as ConnectOptions);
    } catch (error) {
      console.error(`Unable to connect to Room: ${error.message}`);
    } finally {
      if (room) {
        this.roomBroadcast.next(true);
      }
    }

    return room;
  }

  nudge() {
    this.roomBroadcast.next(true);
  }
}
