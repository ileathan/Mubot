import { Component, Input } from '@angular/core';

import { Post } from './Post';
@Component({
  selector: 'post-detail',
  template: `
    <div *ngIf="post">
      <h2>{{post.id}} details!</h2>
      <div><label>Username: </label>{{post.username}}</div>
      <div>
        <label>message: </label>
        <div>{{post.message}}</div>
      </div>
    </div>
  `
})
export class PostDetailComponent {
  @Input() post: Post;
}

