const Command = require('../Command');
const User = require('../../models/User');

const GUESS_BONUS = 1;
const WIN_BONUS = 5;

const Forca = require('./Forca');
const { plural } = require('../../Utils');
const AlreadyGuessedError = require('./AlreadyGuessedError');

const _forca = new Forca();

class ForcaCommand extends Command {
  interfaces = ['discord'];

  constructor(options, forca = _forca) {
    super(options);
    this.forca = forca;
  }

  async handle() {
    if (!this.forca.isRunning()) {
      this.forca.start();
      this.sendToChannel(`\`${this.getHangman()}\``);
      return;
    }

    const [guess] = this.args;
    if (!guess) {
      this.reply('faltou a letra... Use `!forca <letra>` para chutar uma letra.');
      return;
    }

    try {
      const guesses = this.forca.guess(guess);
      const hangman = this.getHangman();

      if (this.forca.isFinished()) {
        if (this.forca.isWin()) {
          const bonus = WIN_BONUS;
          await this.user.addBonus(bonus);
          await this.reply(`você acertou a palavra e ganhou :coin: **${bonus}**. :heart:`);
        } else {
          this.forca.reset();
          await this.reply(`você foi enforcado! A palavra era **${this.forca.word.toUpperCase()}**. :skull:`);
        }
      } else {
        if (guesses > 0) {
          const bonus = GUESS_BONUS * guesses;
          await this.user.addBonus(bonus);
          await this.reply(`${plural('existe', guesses, 'm')} ${guesses} ${plural('letra', guesses)} ${guess.toUpperCase()} na palavra, vc ganhou :coin: **${bonus}**.`);
        } else {
          await this.reply(`não existe nenhuma letra ${guess.toUpperCase()} na palavra. :cry:`);
        }
      }

      await this.sendToChannel(`\`${hangman}\``);
    } catch (err) {
      if (err instanceof AlreadyGuessedError) {
        this.reply(`a letra ${guess.toUpperCase()} já foi usada, tente outra.`);
      } else {
        throw err;
      }
    }
  }

  getHangman() {
    const picture = HANGMAN[this.forca.errorCount];
    const parts = picture.split('\n');
    parts[3] = `${parts[3]}          ${this.forca.toString()}`;
    return parts.map(p => p.padEnd(60)).join('\n');
  }
}

const HANGMAN = [`
  +---+
  |   |
      |
      |
      |
      |
=========`, `
  +---+
  |   |
  O   |
      |
      |
      |
=========`, `
  +---+
  |   |
  O   |
  |   |
      |
      |
=========`, `
  +---+
  |   |
  O   |
 /|   |
      |
      |
=========`, `
  +---+
  |   |
  O   |
 /|\  |
      |
      |
=========`, `
  +---+
  |   |
  O   |
 /|\  |
 /    |
      |
=========`, `
  +---+
  |   |
  O   |
 /|\  |
 / \  |
      |
=========`
];


module.exports = ForcaCommand;
