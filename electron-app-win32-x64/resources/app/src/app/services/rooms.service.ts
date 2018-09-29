import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { FirebaseApp } from 'angularfire2';
import { Person } from '../models/person';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoomsService {
  roomsCollection: AngularFirestoreCollection<Person>;
  presenters: Observable<Person[]>;
  presenterCollection: AngularFirestoreCollection<Person>;
  presenter: Observable<Person[]>;
  audience: Observable<Person[]>;  
  
  roomName;
  
  constructor(
    public afs: AngularFirestore,
    public fbApp: FirebaseApp
    
    ) {
      
      this.presenters = this.afs.collection('presenters').snapshotChanges();
      this.audience = this.afs.collection('audience').snapshotChanges();
      // this.audience = this.afs.collection<Observable<Person[]>>('audience', audience => audience.where("roomName", "==", this.roomName | 0)).snapshotChanges();
      // this.afs.collection<Observable<Person[]>>('presenters', presenter => presenter.where("roomName", "==", this.roomName | 0)).snapshotChanges();
      {
        // this._electronService.ipcRenderer.on('PUSH_RECEIVER:::NOTIFICATION_SERVICE_STARTED', (_, token) => {
        //   console.log('service successfully started', token)
        // })
        // // Handle notification errors
        // this._electronService.ipcRenderer.on('PUSH_RECEIVER:::NOTIFICATION_SERVICE_ERROR', (_, error) => {
        //   console.log('notification error', error)
        // })
        // // Send FCM token to backend
        // this._electronService.ipcRenderer.on('PUSH_RECEIVER:::TOKEN_UPDATED', (_, token) => {
        //   console.log('token updated', token)
        // })
        // // Start service
        // const senderId = '585811144945' // <-- replace with FCM sender ID from FCM web admin under Settings->Cloud Messaging
        // this._electronService.ipcRenderer.send('PUSH_RECEIVER:::START_NOTIFICATION_SERVICE', senderId);
        // // Display notification
        // this._electronService.ipcRenderer.on('PUSH_RECEIVER:::NOTIFICATION_RECEIVED', (_, serverNotificationPayload) => {
        //   // check to see if payload contains a body string, if it doesn't consider it a silent push
        //   if (serverNotificationPayload.notification.body){
        //     // payload has a body, so show it to the user
        //     console.log('display notification', serverNotificationPayload)
        //     let myNotification = new Notification(serverNotificationPayload.notification.title, {
        //       body: serverNotificationPayload.notification.body
        //     })
        //     myNotification.onclick = () => {
        //       console.log('Notification clicked')
        //     }  
        //   } else {
        //     // payload has no body, so consider it silent (and just consider the data portion)
        //     console.log('do something with the key/value pairs in the data', serverNotificationPayload.data)
        //   }
        // })
      }
      
    }
    
    getPresenters() {
      return this.presenters;
    }
    
    getAudience() {
      return this.audience;
    }
    
    addPresenter(person: Person) {
      var presenter = {
        'roomName': person.roomName,
        'token': person.token
      }
      return new Promise((resolve, reject) => {
        this.checkRoom(person.roomName)
        .then(notExists => {
          this.afs.collection('presenters').add(presenter)
          .then(result => {
            // console.log(result);
            this.roomName = person.roomName;
            // this.listenAudience();
            resolve(result);
          })
          .catch(err => {
            console.log(err);
            reject(err);
          });
        })
        .catch(err => {
          console.log(err);
          reject(`'${person.roomName}' already exists!`);
        });
        {
          // try {
          //   this.presenterCollection = this.afs.collection('presenters', presenter => {
          //     return presenter.where('roomName', '==', person.roomName);
          //   });
          //   this.presenter = this.presenterCollection.snapshotChanges();
          //   this.presenter.forEach(doc => {
          //     if(doc.length == 0) {
          //       console.log("New room number");
          //       return this.afs.collection('presenters').add(person)
          //       .then(result => {
          //         resolve(result);
          //       })
          //       .catch(err => {
          //         reject(err);
          //       });
          //     } else if(doc.length > 0) {
          //       console.log("Already exists");
          //       reject("This room is already created!");
          //     }
          //   })
          // } catch (error) {
          //   console.log(error);
          // }
        }
      });
    }
    
    listenAudience() {
      this.audience = this.afs.collection<Observable<Person[]>>('audience', audience => audience.where("roomName", "==", this.roomName)).snapshotChanges();
      return this.audience;
    }
    
    listenPresenter() {
      this.presenter = this.afs.collection<Observable<Person[]>>('presenters', presenter => presenter.where("roomName", "==", this.roomName)).snapshotChanges();
      return this.presenter;
    }
    
    addAudience(person: Person) { 
      var audience = {
        'roomName': person.roomName,
        'audience_id': person.token
      };
      return new Promise((resolve, reject) => {
        this.checkRoom(person.roomName)
        .then(notExists => {
          console.log(notExists);
          reject(`Room'${person.roomName}' not exists!`);
        })
        .catch(exists => {
          this.afs.collection('audience').add(audience)
          .then(result => {
            // resolve(`'${person.roomName}' created!`);
            this.roomName = person.roomName;
            // this.listenPresenter();
            console.log(result);
            resolve(result);
          })
          .catch(err => {
            console.log(err);
            reject(err);
          });
        });
      });
    }
    
    updateAudience(audienceId) {
      var x = Math.random() * 200;
      return new Promise((resolve, reject) => {
        this.afs.collection('audience').doc(audienceId).update({'screenshot': x})
        .then(result => {
          // resolve(`'${person.roomName}' created!`);
          // this.roomName = person.roomName;
          // this.listenPresenter();
          // console.log(result);
          resolve("Updated");
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
      });
    }
    
    updateImageUrl(data) {
      return new Promise((resolve, reject) => {
        this.afs.collection('presenters').doc(data.presenterId).update({'screenshotUrl': data.url, 'fullPath': data.fullPath})
        .then(result => {
          resolve("Url updated");
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
      });
    }
    
    remove(collection, id) {
      // console.log(id);
      return new Promise((resolve, reject) => {
        this.afs.collection(collection).doc(id).delete()
        .then(result => {
          resolve("Document deleted");
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
      })     
    }
    
    checkRoom(roomName) {
      return new Promise((resolve, reject) => {
        try {
          this.presenterCollection = this.afs.collection('presenters', presenter => {
            return presenter.where('roomName', '==', roomName);
          });  
          var flag = true;
          this.presenterCollection.snapshotChanges()
          .subscribe(snapshot => {
            if(snapshot.length == 0) {
              flag = false;
              resolve(true);
            } else if(flag){
              reject(false);
            }
          })
        } catch (error) {
          console.log(error);
          reject(error);
        }
      })
      
    }
    
    // addPresenter(person: Person) {
    //   return new Promise((resolve, reject) => {
    //     this.afs.collection('presenters').add(person)
    //     .then(result => {
    //       console.log(result);
    //       resolve(result);
    //     })
    //     .catch(err => {
    //       console.log(err);
    //       reject(err);
    //     })
    //   });
    // }
    
    // addAudience(person: Person) {
    //   return new Promise((resolve, reject) => {
    //     this.afs.collection('audience').add(person)
    //     .then(result => {
    //       console.log(result);
    //       resolve(result);
    //     })
    //     .catch(err => {
    //       console.log(err);
    //       reject(err);
    //     })
    //   });
    // }
    
  }
  