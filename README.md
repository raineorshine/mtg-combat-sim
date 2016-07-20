# mtg-combat-sim

A web app that generates random combat scenarios for Magic: The Gathering.

![Screenshot](https://raw.githubusercontent.com/raineorshine/mtg-combat-sim/master/screenshot.png)

# Help Wanted

This is an experimental app with much room for improvement. If you are a developer who is interested in contributing, please open an issue to let me know that you'd like to work on something and I will be more than happy to assist you in any way I can! 

Some possible features include:

- Add a web server
- Generate land
- Allow user to choose what set(s) to pull cards from
- Weight card selection by rarity
- Treat emerge cards as colored
- Eliminate trivial scenarios (such as having more creatures than the opponent when they are at 1 life)
- Save a scenario for later viewing

# Setup

```sh
$ git clone https://github.com/raineorshine/mtg-combat-sim
$ cd mtg-combat-sim
$ npm install
$ gulp
$ open public/index.html
```
