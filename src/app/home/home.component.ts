import {Component, OnInit, ViewChild} from '@angular/core';
import {RoomsComponent} from '../rooms/rooms.component';
import {CameraComponent} from '../camera/camera.component';
import {SettingsComponent} from '../settings/settings.component';
import {HubConnection, HubConnectionBuilder, LogLevel} from '@aspnet/signalr';
import {MembersComponent} from '../members/members.component';
import { Room, LocalTrack, LocalVideoTrack, LocalAudioTrack, RemoteParticipant } from 'twilio-video';
import {VideochatService} from '../services/videochat.service';
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  @ViewChild('rooms') rooms: RoomsComponent;
  @ViewChild('camera') camera: CameraComponent;
  @ViewChild('settings') settings: SettingsComponent;
  @ViewChild('participants') participants: MembersComponent;

  activeRoom: Room;

  private notificationHub: HubConnection;

  constructor(
    private readonly videoChatService: VideochatService) { }

  async ngOnInit() {
    const builder =
      new HubConnectionBuilder()
        .configureLogging(LogLevel.Information)
        .withUrl(`${environment.hubUri}/notificationHub`);

    this.notificationHub = builder.build();
    this.notificationHub.on('RoomsUpdated', async updated => {
      if (updated) {
        await this.rooms.updateRooms();
      }
    });
    await this.notificationHub.start();
  }

  async onSettingsChanged(deviceInfo: MediaDeviceInfo) {
    await this.camera.initializePreview(deviceInfo);
  }

  async onLeaveRoom(_: boolean) {
    if (this.activeRoom) {
      this.activeRoom.disconnect();
      this.activeRoom = null;
    }

    this.camera.finalizePreview();
    const videoDevice = this.settings.hidePreviewCamera();
    this.camera.initializePreview(videoDevice);

    this.participants.clear();
  }

  async onRoomChanged(roomName: string) {
    if (roomName) {
      if (this.activeRoom) {
        this.activeRoom.disconnect();
      }

      this.camera.finalizePreview();
      const tracks = await this.settings.showPreviewCamera();

      this.activeRoom =
        await this.videoChatService
          .joinOrCreateRoom(roomName, tracks);

      this.participants.initialize(this.activeRoom.participants);
      this.registerRoomEvents();

      await this.notificationHub.send('RoomsUpdated', true);
    }
  }

  onParticipantsChanged(_: boolean) {
    this.videoChatService.nudge();
  }

  private registerRoomEvents() {
    this.activeRoom
      .on('disconnected',
        (room: Room) => room.localParticipant.tracks.forEach(publication => this.detachLocalTrack(publication.track)))
      .on('participantConnected',
        (participant: RemoteParticipant) => this.participants.add(participant))
      .on('participantDisconnected',
        (participant: RemoteParticipant) => this.participants.remove(participant))
      .on('dominantSpeakerChanged',
        (dominantSpeaker: RemoteParticipant) => this.participants.loudest(dominantSpeaker));
  }

  private detachLocalTrack(track: LocalTrack) {
    if (this.isDetachable(track)) {
      track.detach().forEach(el => el.remove());
    }
  }

  private isDetachable(track: LocalTrack): track is LocalAudioTrack | LocalVideoTrack {
    return !!track
      && ((track as LocalAudioTrack).detach !== undefined
        || (track as LocalVideoTrack).detach !== undefined);
  }
}
