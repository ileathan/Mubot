import { Component } from '@angular/core';

import { Post } from './post';

const POSTS: Post[] = [
{"id":"598c79f99e2879b943c795f2","replyto_user":"leathan","replyto":"5986598677a8cd3b06b07a1d","username":"dude","ismarking":1,"message":"","marks":0,"date":"2017-08-10T15:21:29.134Z"},
{"message":"","id":"598c79489e2879b943c795dc","replyto_user":"leathan","replyto":"5986598677a8cd3b06b07a1d","username":"dude","ismarking":1,"marks":0,"date":"2017-08-10T15:18:32.132Z"},
{"message":"", "id":"598c77f39e2879b943c795a9","replyto_user":"leathan","replyto":"59878a4bb8e15b42c47b8e1e","username":"dude","ismarking":1,"marks":0,"date":"2017-08-10T15:12:51.136Z"},
{"message":"", "id":"598c77c99e2879b943c7959e","replyto_user":"leathan","replyto":"5986598677a8cd3b06b07a1d","username":"dude","ismarking":1,"marks":0,"date":"2017-08-10T15:12:09.484Z"},
{"message":"", "id":"598c77b19e2879b943c79599","replyto":"598a3122a7b97e78450a5c0f","replyto_user":"leathan","username":"dude","ismarking":1,"marks":0,"date":"2017-08-10T15:11:45.632Z"},
{"message":"", "id":"598a091911cd9d5cfcf9b24c","replyto":"598a091711cd9d5cfcf9b24b","replyto_user":"leathan","username":"dude","ismarking":1,"marks":0,"date":"2017-08-08T18:55:21.806Z"},
{"message":"", "id":"598a08e511cd9d5cfcf9b248","replyto":"598a08d811cd9d5cfcf9b247","replyto_user":"leathan","username":"dude","ismarking":1,"marks":0,"date":"2017-08-08T18:54:29.837Z"},
{"message":"", "id":"598a084c11cd9d5cfcf9b23a","replyto":"598a084711cd9d5cfcf9b239","replyto_user":"leathan","username":"dude","ismarking":1,"marks":0,"date":"2017-08-08T18:51:56.509Z"},
{"message":"", "id":"598a066c11cd9d5cfcf9b205","replyto":"598a066811cd9d5cfcf9b202","replyto_user":"leathan","username":"dude","ismarking":1,"marks":0,"date":"2017-08-08T18:43:56.333Z"},
{"message":"", "id":"598a061f11cd9d5cfcf9b1f0","replyto":"598a061911cd9d5cfcf9b1ed","replyto_user":"leathan","username":"dude","ismarking":1,"marks":0,"date":"2017-08-08T18:42:39.096Z"},
{"message":"", "id":"598a05b311cd9d5cfcf9b1e0","replyto":"598a05af11cd9d5cfcf9b1df","replyto_user":"leathan","username":"dude","ismarking":1,"marks":0,"date":"2017-08-08T18:40:51.674Z"},
{"message":"", "id":"598a051f11cd9d5cfcf9b1c9","replyto":"598a04cf11cd9d5cfcf9b1ad","replyto_user":"dude","username":"leathan","ismarking":1,"marks":0,"date":"2017-08-08T18:38:23.846Z"},
{"message":"", "id":"598a051511cd9d5cfcf9b1c5","replyto":"598a050e11cd9d5cfcf9b1c3","replyto_user":"leathan","username":"dude","ismarking":1,"marks":0,"date":"2017-08-08T18:38:13.787Z"},
{"message":"", "id":"598a04d211cd9d5cfcf9b1b1","replyto":"598a045511cd9d5cfcf9b17e","replyto_user":"leathan","username":"dude","ismarking":1,"marks":0,"date":"2017-08-08T18:37:06.268Z"},
{"message":"", "id":"598a04bc11cd9d5cfcf9b19f","replyto":"5988d1e411cd9d5cfcf99049","replyto_user":"dude","username":"leathan","ismarking":1,"marks":0,"date":"2017-08-08T18:36:44.337Z"}
];

@Component({
  selector: 'bitmark-app',
  template: `
    <h1>{{title}}</h1>
    <h2>My Posts</h2>
    <ul class="posts">
      <li *ngFor="let post of posts"
        [class.selected]="post === selectedPost"
        (click)="onSelect(post)">
        <span class="badge">{{post.id}}</span> {{post.name}}
      </li>
    </ul>
    <post-detail [post]="selectedPost"></post-detail>
  `,
  styles: [`
    .selected {
      background-color: blue;
    }
  `]
})
export class AppComponent {
  title = 'Bitmark App';
  posts = POSTS;
  selectedPost: Post;

  onSelect(post: Post): void {
    this.selectedPost = post;
  }
}