import { Component, OnInit } from '@angular/core';
import { Person } from '../../models/person';
import { RoomsService } from '../../services/rooms.service';
import { ElectronService } from 'ngx-electron';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { FirebaseApp } from 'angularfire2';
import { Observable, Notification, Subscription } from 'rxjs';
import { NEXT } from '@angular/core/src/render3/interfaces/view';
import { FsService } from 'ngx-fs';
import { AngularFireStorage, AngularFireUploadTask } from 'angularfire2/storage';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  
  message;
  person: Person;
  presenterCollection: AngularFirestoreCollection<Person>;
  tempPresentor: AngularFirestoreDocument<any>;
  presenter: Observable<any>;
  audience: Observable<Person[]>;
  presenterId;
  audienceId;
  isAudience = false;
  isPresenter = false;
  roomName;
  captureFlag = false;
  iWant: boolean = false;
  
  audSub: Subscription;
  preSub: Subscription;
  
  prevCount  = 0;
  
  valid: boolean = false;
  canCapture: boolean = false;
  
  task: AngularFireUploadTask;
  
  constructor(
    private http: HttpClient,
    public roomService: RoomsService,
    public _electronService: ElectronService,
    public _fsService: FsService,
    public afs: AngularFirestore,
    public fbApp: FirebaseApp,
    public storage: AngularFireStorage
    ) {
      this.person = {
        type: "Presenter",
        roomName: null,
        token: null
      };
      // Listen for service successfully started
      this._electronService.ipcRenderer.on('PUSH_RECEIVER:::NOTIFICATION_SERVICE_STARTED', (_, token) => {
        // console.log('service successfully started', token)
        this.person.token = token;
      })
      // Handle notification errors
      this._electronService.ipcRenderer.on('PUSH_RECEIVER:::NOTIFICATION_SERVICE_ERROR', (_, error) => {
        console.log('notification error', error)
      })
      // Send FCM token to backend
      this._electronService.ipcRenderer.on('PUSH_RECEIVER:::TOKEN_UPDATED', (_, token) => {
        console.log('token updated', token)
      })
      // Start service
      const senderId = '585811144945' // <-- replace with FCM sender ID from FCM web admin under Settings->Cloud Messaging
      console.log('starting service and registering a client')
      this._electronService.ipcRenderer.send('PUSH_RECEIVER:::START_NOTIFICATION_SERVICE', senderId);
      
      this._electronService.ipcRenderer.on("winClose", (event) => {
        if(this.isAudience) {
          this.leaveRoom();
        } else if(this.isPresenter) {
          this.closeRoom();
        }
        return true;
      })
    }
    
    ngOnInit() {
      try {
        this._electronService.ipcRenderer.on('PUSH_RECEIVER:::NOTIFICATION_RECEIVED', (_, serverNotificationPayload) => {
          // check to see if payload contains a body string, if it doesn't consider it a silent push
          if (serverNotificationPayload.notification.body){
            // payload has a body, so show it to the user
            console.log('display notification', serverNotificationPayload)
            let myNotification = new Notification(serverNotificationPayload.notification.title, {
              body: serverNotificationPayload.notification.body
            })
          } else {
            // payload has no body, so consider it silent (and just consider the data portion)
            console.log('do something with the key/value pairs in the data', serverNotificationPayload.data)
          }
        })
        
      } catch (error) {
        console.log(error);
      }
    }
    
    submitForm(form) {
      if(form.valid) {
        this.person.type = form.value.type;
        this.person.roomName = form.value.roomName;
        this.roomName = this.person.roomName;
        this.valid = true;
        if(this.person.type == "Presenter") {
          this.roomService.addPresenter(this.person)
          .then(person => {
            // console.log(person);
            this.presenterId = person["id"];
            alert(`Room: '${this.person.roomName}' created!`);
            form.reset();
            // this.roomService.listenAudience()
            this.presenterId = person["id"];
            this.isPresenter = true;
            this.audSub = this.roomService.listenAudience()
            .subscribe(change => {
              // console.log(change);
              // console.log(change.length);
              if(change.length != this.prevCount) {
                this.prevCount = change.length;
                return;
              }
              // console.log(this.prevCount);
              this.prevCount = change.length;
              for(var i = 0; i<change.length; i++) {
                // console.log(change[i].type);
                if(change[i].type != "added") {
                  this.capture(this.person.token);
                  break;
                }
              }
              // if(change.length !== 0) {
              //   // console.log(change);
              //   if(this.iWant == false) {
              //     return;
              //   }
              //   console.log("going to capture screen");
              
              //   this.capture(this.person.token);
              //   // this._electronService.ipcRenderer.send("captureScreen", 2);
              // }
            })
            // alert("Room successfully created!");
          })
          .catch(err => {
            console.log(err);
            this.valid = false;
            alert(err);
          });
        } else if (this.person.type == "Audience") {
          this.roomName = this.person.roomName;
          this.roomService.addAudience(this.person)
          .then(result => {
            alert(`Room:'${this.person.roomName}' joined`);
            this.audienceId = result["id"];
            form.reset();
            this.isAudience = true;
            this.preSub = this.roomService.listenPresenter()
            .subscribe(async uploaded => {
              // console.log(uploaded);
              if(uploaded.length == 0){
                this.isAudience = false;
                this.leaveRoom(false);
                alert("Presenter has deleted the room!");
              } else {
                if(this.iWant == false) {
                  return;
                }
                // console.log(uploaded);
                // console.log(uploaded[0]["payload"]["doc"]["id"]);
                // console.log(uploaded.length);
                let url, fullPath;
                url = uploaded["0"].payload.doc._document.data.internalValue.root.right.left.value.internalValue;
                fullPath = uploaded["0"].payload.doc._document.data.internalValue.root.left.value.internalValue;
                // console.log(url);
                // console.log(fullPath);
                // console.log(url.substr(0, 5));
                // console.log(url.substr(0, 5) == "https");
                // console.log(url.substr(0, 5) == "https");
                if(url.substr(0, 5) == "https") {
                  console.log(url);
                  await this._electronService.ipcRenderer.send("downloadImage", {
                    url,
                    properties: {directory: "Directory is here"}
                  });
                  this.canCapture = false;
                  alert("Screenshot saved in downloads folder!");
                  this.iWant = false;
                  setTimeout(() => {
                    this.storage.ref(fullPath).delete();
                  }, 20000);
                }
              }
            })
          })
          .catch(err => {
            console.log(err);
            this.valid = false;
            alert(`Room:'${this.person.roomName}' not found`);
          })
        }
      }
    }
    
    capture(updated) {
      
      const thumbSize = this._electronService.screen.getPrimaryDisplay().size;
      let options = {types: ['screen'], thumbnailSize: thumbSize};
      // console.log(thumbSize);
      this._electronService.desktopCapturer.getSources(options, (err, sources) => {
        if(err) {
          console.log(err);
          console.log(err.message);
          return;
        }
        console.log(sources);
        sources.forEach((source) => {
          if(source.name === "Entire screen" || source.name === "Screen 1") {
            var path = `screenshot/${this.person.token}_${new Date().getTime()}_screenshot.png`
            // console.log(options);
            // console.log(source);
            // console.log(source.thumbnail);
            // console.log(source.thumbnail.toPNG());
            this.task = this.storage.upload(path, source.thumbnail.toPNG());
            this.task.then(task => {
              // console.log(task);
              // console.log(task.ref.fullPath);
              task.ref.getDownloadURL()
              .then(url => {
                // console.log(url);
                this.roomService.updateImageUrl({presenterId: this.presenterId, url, fullPath: task.ref.fullPath})
                .then(success => {
                  console.log(success);
                })
                .catch(err => {
                  console.log(err);
                })
              })
              .catch(err => {
                console.log(err);
              })
            })
            .catch(err => {
              console.log(err);
            });
          }
        })
      })
    }
    
    closeRoom() {
      this.canCapture = true;
      this.roomService.remove('presenters', this.presenterId)
      .then(result => {
        alert("Room deleted!");
        this.isPresenter = false;
        this.valid = false;
        this.audSub.unsubscribe();
        this.ngOnInit();
      })
      .catch(err => {
        console.log(err);
      })
    }
    
    leaveRoom(show?) {
      this.roomService.remove('audience', this.audienceId)
      .then(result => {
        this.valid = false;
        if(show) {
          alert("Room left.");
        }
        // alert("Your session is broken!\nTry to reconnect.");
        // console.log(this.audienceId);
        this.preSub.unsubscribe();
        this.isAudience = false;
        this.canCapture = true;
        this.ngOnInit();
      })
      .catch(err => {
        console.log(err);
      })
    }
    
    captureScreen() {
      // console.log("Going to capture screen...");
      this.iWant = true;
      this.canCapture = true;
      this.roomService.updateAudience(this.audienceId);
      // this._electronService.ipcRenderer.on('captureScreen')
    }
  }
  