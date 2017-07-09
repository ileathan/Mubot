# hubot-bustabit

A hubot bustabit integration script which supports single or multi person betting.
Future versions will support single person funds for betting in community channels
aside from the current community fund only mode.

**NOTE - For this script to work you must keep a browser logged in to bustabit.com
and you must follow the directions in [`bustabit-setup.md`](bustabit-setup.md)**

See [`src/bustabit.coffee`](src/bustabit.coffee) for full documentation.

## Installation

In hubot project repo, run:

`npm install hubot-bustabit --save`

Then add **hubot-bustabit** to your `external-scripts.json`:

```json
["hubot-bustabit"]
```

## Sample Ussage

```
user1>> bet 100 1.01
hubot>> Betting 1 bit(s) next game. [Cashout @ x1.12]
hubot>> Bet placed, you may rebet.
hubot>> You won 101.00 bit(s). Total 743

```
