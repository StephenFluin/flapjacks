import { Component, inject } from '@angular/core';
import { Game } from '../game';

@Component({
  selector: 'app-home',
  imports: [],
  template: `<div>{{this.game.players.length}} Players</div>
  @for (player of game.players; track $index; let playerIndex = $index) {
    <div style="border: 1px solid red; padding:16px;margin:32px;">
      <div>Player {{$index + 1}}: {{player.hand.length}} cards in hand, {{player.equipment.length}} equipment, {{player.tree ? 'has a tree' : 'no tree'}}</div> 
      <fieldset><legend>Hand</legend>
        @for (card of player.hand; track $index) {
          <div>{{card.name}}  @if(this.game.currentTurnIndex == playerIndex) { <button (click)="this.game.play(player,card)">Play</button>  
          <button (click)="this.game.discard(player, card)">Discard</button> }
          </div> 
        }
      </fieldset>
      <fieldset><legend>Equipment</legend>
        @for (equip of player.equipment; track $index) {
          <div>{{equip.name}}</div>
        }
      </fieldset>
      <fieldset><legend>Tree</legend>
        @if (player.tree) {
          <div>{{player.tree.name}}: {{player.tree.chops}}/{{player.tree.requiredChops}} chops, {{player.tree.points}} points</div>
        } @else {
          <div>No tree</div>
        }
      </fieldset>
      <div>Score: {{player.score}}</div>
    </div>
  }
  `,
  styles: ``,
})
export class Home {
  game = inject(Game);
  constructor() {
    this.game.newGame(2);
  }

}
