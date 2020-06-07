import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {NamedRoom, VideochatService} from '../services/videochat.service';
import {Subscription} from 'rxjs';
import {tap} from 'rxjs/operators';

@Component({
  selector: 'app-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css']
})
export class RoomsComponent implements OnInit, OnDestroy {
  @Output() roomChanged = new EventEmitter<string>();
  @Input() activeRoomName: string;

  roomName: string;
  rooms: NamedRoom[];

  private subscription: Subscription;

  constructor(
    private readonly videoChatService: VideochatService) { }

  async ngOnInit() {
    await this.updateRooms();
    this.subscription =
      this.videoChatService
        .$roomsUpdated
        .pipe(tap(_ => this.updateRooms()))
        .subscribe();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onTryAddRoom() {
    if (this.roomName) {
      this.onAddRoom(this.roomName);
    }
  }

  onAddRoom(roomName: string) {
    this.roomName = null;
    this.roomChanged.emit(roomName);
  }

  onJoinRoom(roomName: string) {
    this.roomChanged.emit(roomName);
  }

  async updateRooms() {
    this.rooms = (await this.videoChatService.getAllRooms()) as NamedRoom[];
  }
}
