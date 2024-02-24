"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    constructor(socket, id, name, online) {
        this.online = true;
        this.socket = socket;
        this.online = online;
        this.name = name;
        this.id = id;
    }
}
exports.Player = Player;
