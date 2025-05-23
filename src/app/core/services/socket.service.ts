import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.SOCKET_ENDPOINT, {
      withCredentials: true
    });
  }


joinTaskRoom(taskId: number) {
  this.socket.emit('joinRoom', `task-${taskId}`);
}


  // Listen for new messages
  onNewTaskMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('newTaskMessage', data => {
        observer.next(data);
      });
    });
  }

  // Send a custom message if needed
  sendMessage(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }

  disconnect() {
    this.socket.disconnect();
  }
}
