"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var POSTS = [
    { "id": "598c79f99e2879b943c795f2", "replyto_user": "leathan", "replyto": "5986598677a8cd3b06b07a1d", "username": "dude", "ismarking": 1, "message": "", "marks": 0, "date": "2017-08-10T15:21:29.134Z" },
    { "message": "", "id": "598c79489e2879b943c795dc", "replyto_user": "leathan", "replyto": "5986598677a8cd3b06b07a1d", "username": "dude", "ismarking": 1, "marks": 0, "date": "2017-08-10T15:18:32.132Z" },
    { "message": "", "id": "598c77f39e2879b943c795a9", "replyto_user": "leathan", "replyto": "59878a4bb8e15b42c47b8e1e", "username": "dude", "ismarking": 1, "marks": 0, "date": "2017-08-10T15:12:51.136Z" },
    { "message": "", "id": "598c77c99e2879b943c7959e", "replyto_user": "leathan", "replyto": "5986598677a8cd3b06b07a1d", "username": "dude", "ismarking": 1, "marks": 0, "date": "2017-08-10T15:12:09.484Z" },
    { "message": "", "id": "598c77b19e2879b943c79599", "replyto": "598a3122a7b97e78450a5c0f", "replyto_user": "leathan", "username": "dude", "ismarking": 1, "marks": 0, "date": "2017-08-10T15:11:45.632Z" },
    { "message": "", "id": "598a091911cd9d5cfcf9b24c", "replyto": "598a091711cd9d5cfcf9b24b", "replyto_user": "leathan", "username": "dude", "ismarking": 1, "marks": 0, "date": "2017-08-08T18:55:21.806Z" },
    { "message": "", "id": "598a08e511cd9d5cfcf9b248", "replyto": "598a08d811cd9d5cfcf9b247", "replyto_user": "leathan", "username": "dude", "ismarking": 1, "marks": 0, "date": "2017-08-08T18:54:29.837Z" },
    { "message": "", "id": "598a084c11cd9d5cfcf9b23a", "replyto": "598a084711cd9d5cfcf9b239", "replyto_user": "leathan", "username": "dude", "ismarking": 1, "marks": 0, "date": "2017-08-08T18:51:56.509Z" },
    { "message": "", "id": "598a066c11cd9d5cfcf9b205", "replyto": "598a066811cd9d5cfcf9b202", "replyto_user": "leathan", "username": "dude", "ismarking": 1, "marks": 0, "date": "2017-08-08T18:43:56.333Z" },
    { "message": "", "id": "598a061f11cd9d5cfcf9b1f0", "replyto": "598a061911cd9d5cfcf9b1ed", "replyto_user": "leathan", "username": "dude", "ismarking": 1, "marks": 0, "date": "2017-08-08T18:42:39.096Z" },
    { "message": "", "id": "598a05b311cd9d5cfcf9b1e0", "replyto": "598a05af11cd9d5cfcf9b1df", "replyto_user": "leathan", "username": "dude", "ismarking": 1, "marks": 0, "date": "2017-08-08T18:40:51.674Z" },
    { "message": "", "id": "598a051f11cd9d5cfcf9b1c9", "replyto": "598a04cf11cd9d5cfcf9b1ad", "replyto_user": "dude", "username": "leathan", "ismarking": 1, "marks": 0, "date": "2017-08-08T18:38:23.846Z" },
    { "message": "", "id": "598a051511cd9d5cfcf9b1c5", "replyto": "598a050e11cd9d5cfcf9b1c3", "replyto_user": "leathan", "username": "dude", "ismarking": 1, "marks": 0, "date": "2017-08-08T18:38:13.787Z" },
    { "message": "", "id": "598a04d211cd9d5cfcf9b1b1", "replyto": "598a045511cd9d5cfcf9b17e", "replyto_user": "leathan", "username": "dude", "ismarking": 1, "marks": 0, "date": "2017-08-08T18:37:06.268Z" },
    { "message": "", "id": "598a04bc11cd9d5cfcf9b19f", "replyto": "5988d1e411cd9d5cfcf99049", "replyto_user": "dude", "username": "leathan", "ismarking": 1, "marks": 0, "date": "2017-08-08T18:36:44.337Z" }
];
var AppComponent = (function () {
    function AppComponent() {
        this.title = 'Bitmark App';
        this.posts = POSTS;
    }
    AppComponent.prototype.onSelect = function (post) {
        this.selectedPost = post;
    };
    return AppComponent;
}());
AppComponent = __decorate([
    core_1.Component({
        selector: 'bitmark-app',
        template: "\n    <h1>{{title}}</h1>\n    <h2>My Posts</h2>\n    <ul class=\"posts\">\n      <li *ngFor=\"let post of posts\"\n        [class.selected]=\"post === selectedPost\"\n        (click)=\"onSelect(post)\">\n        <span class=\"badge\">{{post.id}}</span> {{post.name}}\n      </li>\n    </ul>\n    <post-detail [post]=\"selectedPost\"></post-detail>\n  ",
        styles: ["\n    .selected {\n      background-color: blue;\n    }\n  "]
    })
], AppComponent);
exports.AppComponent = AppComponent;
//# sourceMappingURL=app.component.js.map