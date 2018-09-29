import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../environments/environment';
import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireStorageModule } from 'angularfire2/storage';
import { NgxElectronModule } from 'ngx-electron';
import { NgxFsModule } from 'ngx-fs';

import { AppComponent } from './app.component';
import { HomepageComponent } from './components/homepage/homepage.component';
import { RoomsService } from './services/rooms.service';
import { HttpClientModule } from '@angular/common/http'

@NgModule({
  declarations: [
    AppComponent,
    HomepageComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NgxFsModule,
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebase, 'screenshot'),
    AngularFirestoreModule,
    AngularFireStorageModule,
    NgxElectronModule
  ],
  providers: [RoomsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
