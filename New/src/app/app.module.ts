import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';

import { AppComponent }        from './app.component';
import { PostDetailComponent } from './post-detail.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule
  ],
  declarations: [
    AppComponent,
    PostDetailComponent
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
