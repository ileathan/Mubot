// Description:
//   The game of Hangman.
//   Words and definitions are sourced via the Wordnik API. You'll need an API
//   key from http://developer.wordnik.com/
//
// Dependencies:
//   None
//
// Configuration:
//   WORDNIK_API_KEY
//
// Commands:
//   hubot hangman - Display the state of the current game
//   hubot hangman <letterOrWord> - Make a guess
//
// Author:
//   harukizaemon

(function() {
  var Game, defineWord, generateWord, isOrAre, play, pluralisedGuess,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Game = (function() {
    function Game(word, definitions1) {
      var letter;
      this.definitions = definitions1;
      this.word = word.toUpperCase();
      this.wordLetters = this.word.split(/(?:)/);
      this.answerLetters = (function() {
        var i, len, ref, results;
        ref = this.wordLetters;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          letter = ref[i];
          results.push("\\_");
        }
        return results;
      }).call(this);
      this.remainingGuesses = 9;
      this.previousGuesses = [];
      this.message = null;
    }

    Game.prototype.isFinished = function() {
      return this.wasAnswered() || this.wasHung();
    };

    Game.prototype.wasAnswered = function() {
      return indexOf.call(this.answerLetters, "\\_") < 0;
    };

    Game.prototype.wasHung = function() {
      return this.remainingGuesses === 0;
    };

    Game.prototype.guess = function(guess) {
      if (!guess) {
        this.noGuess();
        return;
      }
      guess = guess.trim().toUpperCase();
      if (indexOf.call(this.previousGuesses, guess) >= 0) {
        return this.duplicateGuess(guess);
      } else {
        this.previousGuesses.push(guess);
        switch (guess.length) {
          case 1:
            return this.guessLetter(guess);
          case this.word.length:
            return this.guessWord(guess);
          default:
            return this.errantWordGuess(guess);
        }
      }
    };

    Game.prototype.guessLetter = function(guess) {
      var i, index, indexes, len, letter;
      indexes = (function() {
        var i, len, ref, results;
        ref = this.wordLetters;
        results = [];
        for (index = i = 0, len = ref.length; i < len; index = ++i) {
          letter = ref[index];
          if (guess === letter) {
            results.push(index);
          }
        }
        return results;
      }).call(this);
      if (indexes.length > 0) {
        for (i = 0, len = indexes.length; i < len; i++) {
          index = indexes[i];
          this.answerLetters[index] = this.wordLetters[index];
        }
        return this.correctGuess("Yes, there " + (isOrAre(indexes.length, guess)));
      } else {
        return this.incorrectGuess("Sorry, there are no " + guess + "'s");
      }
    };

    Game.prototype.guessWord = function(guess) {
      if (guess === this.word) {
        this.answerLetters = this.wordLetters;
        return this.correctGuess("Yes, that's correct");
      } else {
        return this.incorrectGuess("Sorry, the word is not " + guess);
      }
    };

    Game.prototype.noGuess = function() {
      return this.message = null;
    };

    Game.prototype.errantWordGuess = function(guess) {
      return this.message = "The word " + guess + " isn't the correct length so let's pretend that never happened, shall we?";
    };

    Game.prototype.duplicateGuess = function(guess) {
      return this.message = "You already tried " + guess + " so let's pretend that never happened, shall we?";
    };

    Game.prototype.correctGuess = function(message) {
      return this.message = message;
    };

    Game.prototype.incorrectGuess = function(message) {
      if (this.remainingGuesses > 0) {
        this.remainingGuesses -= 1;
      }
      return this.message = message;
    };

    Game.prototype.eachMessage = function(callback) {
      if (this.message) {
        callback(this.message);
      }
      if (this.isFinished()) {
        if (this.wasHung()) {
          callback("You have no remaining guesses");
        } else if (this.wasAnswered()) {
          callback("Congratulations, you still had " + (pluralisedGuess(this.remainingGuesses)) + " remaining!");
        }
        callback("The " + this.wordLetters.length + " letter word was: " + this.word);
        return callback(this.definitions);
      } else {
        callback("The " + this.answerLetters.length + " letter word is: " + (this.answerLetters.join(' ')));
        return callback("You have " + (pluralisedGuess(this.remainingGuesses)) + " remaining");
      }
    };

    return Game;

  })();

  module.exports = function(bot) {
    var gamesByRoom;
    gamesByRoom = {};
    return bot.hear(/^hangman( .*)?$/i, function(msg) {
      var room;
      if (process.env.WORDNIK_API_KEY === void 0) {
        msg.send("Missing WORDNIK_API_KEY env variable.");
        return;
      }
      room = msg.message.user.room;
      return play(msg, gamesByRoom[room], function(game) {
        gamesByRoom[room] = game;
        game.guess(msg.match[1]);
        return game.eachMessage(function(message) {
          return msg.send(message);
        });
      });
    });
  };

  play = function(msg, game, callback) {
    if (!game || game.isFinished()) {
      return generateWord(msg, function(word, definitions) {
        return callback(new Game(word, definitions));
      });
    } else {
      return callback(game);
    }
  };

  generateWord = function(msg, callback) {
    return msg.http("http://api.wordnik.com/v4/words.json/randomWord").query({
      hasDictionaryDef: true,
      minDictionaryCount: 3,
      minLength: 5
    }).headers({
      api_key: process.env.WORDNIK_API_KEY
    }).get()(function(err, res, body) {
      var result, word;
      result = JSON.parse(body);
      word = result ? result.word : "hangman";
      return defineWord(msg, word, callback);
    });
  };

  defineWord = function(msg, word, callback) {
    return msg.http("http://api.wordnik.com/v4/word.json/" + (escape(word)) + "/definitions").header("api_key", process.env.WORDNIK_API_KEY).get()(function(err, res, body) {
      var definitions, lastSpeechType, reply;
      definitions = JSON.parse(body);
      if (definitions.length === 0) {
        return callback(word, "No definitions found.");
      } else {
        reply = "";
        lastSpeechType = null;
        definitions = definitions.forEach(function(def) {
          if (def.partOfSpeech !== lastSpeechType) {
            if (def.partOfSpeech !== void 0) {
              reply += " (" + def.partOfSpeech + ")\n";
            }
          }
          lastSpeechType = def.partOfSpeech;
          return reply += "  - " + def.text + "\n";
        });
        return callback(word, reply);
      }
    });
  };

  isOrAre = function(count, letter) {
    if (count === 1) {
      return "is one " + letter;
    } else {
      return "are " + count + " " + letter + "'s";
    }
  };

  pluralisedGuess = function(count) {
    if (count === 1) {
      return "one guess";
    } else {
      return count + " guesses";
    }
  };

}).call(this);
