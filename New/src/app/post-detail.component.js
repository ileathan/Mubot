"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var Post_1 = require("./Post");
var PostDetailComponent = (function () {
    function PostDetailComponent() {
    }
    return PostDetailComponent;
}());
__decorate([
    core_1.Input(),
    __metadata("design:type", Post_1.Post)
], PostDetailComponent.prototype, "post", void 0);
PostDetailComponent = __decorate([
    core_1.Component({
        selector: 'post-detail',
        template: "\n    <div *ngIf=\"post\">\n      <h2>{{post.id}} details!</h2>\n      <div><label>Username: </label>{{post.username}}</div>\n      <div>\n        <label>message: </label>\n        <div>{{post.message}}</div>\n      </div>\n    </div>\n  "
    })
], PostDetailComponent);
exports.PostDetailComponent = PostDetailComponent;
//# sourceMappingURL=post-detail.component.js.map