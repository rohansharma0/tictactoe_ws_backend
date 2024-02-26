"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    constructor(socket, id, name, playingAs) {
        this.socket = socket;
        this.playingAs = playingAs;
        this.name = name;
        this.id = id;
    }
}
exports.Player = Player;
