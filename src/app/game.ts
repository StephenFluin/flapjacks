import { Service } from '@angular/core';

@Service()
export class Game {
    players: Player[] = [];
    library: Card[] = STANDARD_CARDS;
    treeLibrary: Tree[] = STANDARD_TREES;
    discards: Card[] = [];
    currentTurnIndex = -1;

    newGame(playerCount: number) {
        this.players = [];
        this.library.sort(() => Math.random() - 0.5); // Shuffle the library
        this.treeLibrary.sort(() => Math.random() - 0.5); // Shuffle the tree library
        for (let i = 0; i < playerCount; i++) {
            this.players.push(new Player(i+1));
            this.players[i].hand.push(this.getNextCard());
            this.players[i].hand.push(this.getNextCard());
            this.players[i].hand.push(this.getNextCard());

        }
        this.nextTurn();

    }
    nextTurn() {
        console.log("Playing next turn");
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
        this.startPlayerTurn(this.players[this.currentTurnIndex]);
    }

    play(player: Player, card: Card) {
        player.hand = player.hand.filter(c => c !== card);

        if(card.targeteable) {
            // For now, just play it on the player themselves
            console.log("Player " + player + " played card: " + card.name + " on themselves, but it will be targeteable.");
        }


        // If it's a duplicate equipment, discard the old one
        // Axes replace any previous axe
        if(card instanceof Axe) {
            // Find the matching card, if one exists
            const oldAxe = player.equipment.find(equip => equip instanceof Axe);
            if(oldAxe) {
                player.equipment = player.equipment.filter(equip => equip !== oldAxe);
                this.discards.push(oldAxe);
            }
        }

        // At most 1 card of any name for all other cards
        if(card instanceof Equipment) {
            const oldEquip = player.equipment.find(equip => equip.name === card.name);
            if(oldEquip) {
                player.equipment = player.equipment.filter(equip => equip !== oldEquip);
                this.discards.push(oldEquip);
            }
        }
        // Boots remove foot slips
        if(card.name === "Boots") {
            const oldModifier = player.equipment.find(equip => equip.name !== "Foot Slip");
            if(oldModifier) {
                player.equipment = player.equipment.filter(equip => equip !== oldModifier);
                this.discards.push(oldModifier);
            }
        }
        // Gloves remove blisters
        if(card.name === "Gloves") {
            const oldModifier = player.equipment.find(equip => equip.name === "Blisters");
            if(oldModifier) {
                player.equipment = player.equipment.filter(equip => equip !== oldModifier);
                this.discards.push(oldModifier);
            }
        }

        // If it's equipment, move it there
        if (card instanceof Equipment) {
            player.equipment.push(card);
        } else {
            this.discards.push(card);
        }
        console.log("Player " + player + " played card: " + card.name);
        this.endPlayerTurn(player);
    }
    discard(player: Player, card: Card) {
        player.hand = player.hand.filter(c => c !== card);
        this.discards.push(card);
        console.log("Player " + player + " discarded card: " + card.name);
        this.endPlayerTurn(player);
    }

    startPlayerTurn(player: Player) {
        player.hand.push(this.getNextCard());
        if(!player.tree) {
            player.tree = this.getNextTree();
        }

        // Play cards and equipment

        

    }
    endPlayerTurn(player: Player) {
        // Chopping Phase
        if(player.has("Long Saw and Partner")) {
            let failCount = 0;
            let successCount = 0;
            for(let i = 0; i< 5;i++) {
                const roll = roll1d6();
                if(roll < 4) {
                    failCount++;
                } else {
                    successCount++;
                }
            }
            if(failCount >= 4) {
                player.equipment = player.equipment.filter(equip => equip.name !== "Long Saw and Partner");
                this.getNextPlayer(player).equipment.push(new Equipment("Long Saw and Partner"));
            }
            // Give the tree successCount chops
            player.tree!.chops += successCount;
            log("Player " + player + " has chopped the tree: " + player.tree!.name + " with " + successCount + " successful chops. Total chops: " + player.tree!.chops + "/" + player.tree!.requiredChops);
        
         // Normal Chopping phase
        } else {
            // Get the user's axe if they have one
            const axe = player.equipment.find(equip => equip instanceof Axe) as Axe | undefined;
            let rolls = 0;
            if(axe) {
                rolls = axe.chops;

                rolls += player.calculateChopModifier();
            } else {
                rolls = 0;
            }
            let failCount = 0;
            console.log("Player " + player + " is chopping the tree: " + player.tree!.name + " with " + rolls + " rolls.");
            for(let i = 0; i < rolls; i++) {
                const roll = roll1d6();
                if(roll >= 4) {
                    player.tree!.chops++;
                    log("Player " + player + " has chopped the tree! Total chops: " + player.tree!.chops + "/" + player.tree!.requiredChops);
                } else if (roll <= 2) {
                    failCount++;     
                }  
            } 
            if(failCount >= 3 && axe && axe.name != "Titanium Axe") {
                log("Player " + player + " has broken their axe!");
                player.equipment = player.equipment.filter(equip => !(equip instanceof Axe));
            }

            
        }
        if(player.has("Assistant")) {
            console.log("Player " + player + "'s assistant is chopping the tree!");
            const roll = roll1d6();
            if(roll >= 4) {
                log("Player " + player + "'s assistant has chopped the tree! Total chops: " + player.tree!.chops + "/" + player.tree!.requiredChops);
                player.tree!.chops++;
            }
        }
        if(player.tree!.chops >= player.tree!.requiredChops) {
            log("Player " + player + " has completed the tree: " + player.tree!.name);
            player.score += player.tree!.points;
            player.completedTrees.push(player.tree!);
            player.tree = null;
        }


        this.cleanUp(player);
        this.nextTurn();
    }

    getNextCard(): Card {
        if(this.library.length === 0) {
            this.library = this.discards;
            this.discards = [];
            this.library.sort(() => Math.random() - 0.5); // Shuffle the library
        }
        return this.library.pop()!;
    }
    getNextTree(): Tree {
        return this.treeLibrary.pop()!;
    }

    getNextPlayer(currentPlayer: Player): Player {
        const currentIndex = this.players.indexOf(currentPlayer);
        const nextIndex = (currentIndex + 1) % this.players.length;
        return this.players[nextIndex];
    }
    cleanUp(player: Player) {
        // Go one by one so we can add them to discard
        for(const equip of player.equipment) {
            if(["Flapjacks", "Short Stack", "Axe Slip", "Foot Slip"].includes(equip.name)) {
                player.equipment = player.equipment.filter(e => e !== equip);
                // Add to discards
                this.discards.push(equip);
            }
        }
    }
}


export class Player {
    hand: Card[] = [];
    equipment: Equipment[] = [];
    completedTrees: Tree[] = [];
    tree: Tree | null = null;
    score: number = 0;
    turnChopModifier = 0;

    constructor(public playerNumber: number) {

    }
    has(cardName: string): boolean {
        return this.equipment.some(equip => equip.name === cardName);
    }
    calculateChopModifier(): number {
        let modifier = 0;
        for(const equip of this.equipment) {
            if(CHOP_MODIFIERS[equip.name]) {
                modifier += CHOP_MODIFIERS[equip.name];
            }
        }
        return modifier;
    }

}  

export class Card {
    constructor(public name: string, public targeteable: boolean = false) {

    }
}

export class Equipment extends Card {
    constructor(name: string, targeteable: boolean = false) {
        super(name, targeteable);
    }
}

// Equipment is a type of Card
export class Axe extends Equipment {
    constructor(name: string, public chops: number, targeteable: boolean = false) {
        super(name, targeteable);
    }
}

export class Tree {
    public chops = 0;
    constructor(public requiredChops: number, public points: number, public name: string) {
    }

}

export const STANDARD_TREES = [
    // 8 norway pines
    // Add 8 Norway Pines to the game
    ...Array(8).fill(null).map(() => new Tree(4,4,"Norway Pine")),
    // 8 River Birch
    ...Array(8).fill(null).map(() => new Tree(4,5, "River Birch")),
    // 7 Cottonwood
    ...Array(7).fill(null).map(() => new Tree(5,6, "Cottonwood")),
    // 8 Red Oak
    ...Array(8).fill(null).map(() => new Tree(6,7, "Red Oak")),
    // 3 Silver Maple
    ...Array(3).fill(null).map(() => new Tree(7,8, "Silver Maple")),
    // 2 American Elm
    ...Array(2).fill(null).map(() => new Tree(8,8, "American Elm")),
    new Tree(9,12,"Mighty Oak"),
];

export const STANDARD_CARDS: Card[] = [
    new Axe("Carpenter Axe", 3),
    new Axe("Dull Axe", 2, true),
    new Axe("Titanium Axe", 4),
    new Card("Switch Tags", true),
    new Equipment("Assistant"),
    new Equipment("Long Saw and Partner"),
    new Card("Paperwork"),
    new Equipment("Blisters", true),
    new Equipment("Foot Slip", true),
    new Equipment("Axe Slip", true),
    new Equipment("Flapjacks"),
    new Equipment("Short Stack"),
    new Equipment("Boots"),
    new Card("Break Axe", true),
    new Card("That Darn Sasquatch"),
    new Card("Debunk"),
]

export const CHOP_MODIFIERS: { [key: string]: number } = {"Blisters": -1, "Axe Slip": -1, "Foot Slip": -1, "Flapjacks": 2, "Short Stack": 1};


export const roll1d6 = () => Math.floor(Math.random() * 6) + 1;

export const log = (message: string) => {
    console.log(message);
}