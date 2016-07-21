import 'babel-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import * as mtg from 'mtgsdk'
const r = require('r-dom')
import { a, div, footer, img, hr, span } from 'r-dom'
import { filter, merge, random, repeat, sample, sampleSize } from 'lodash'
import { binary, pipe, prop, propEq, range, sort, max } from 'ramda'

const ALL_COLORS = ['White', 'Blue', 'Black', 'Red', 'Green']
const NUM_COLORS = 2
const HAND_SIZE_MIN = 1
const HAND_SIZE_MAX = 3
const BOARD_SIZE_MIN = 2
const BOARD_SIZE_MAX = 4
const LIFE_MIN = 1
const LIFE_MAX = 20
const MAX_ALPHA_BUFFER = 5
const GITHUB_SOURCE = 'https://github.com/raineorshine/mtg-combat-sim'

const BANNED = [
  'Coax from the Blind Eternities',
  'Emrakul, the Promised End',
  'Lupine Prototype'
]

let state = {
  loading: { count: 0 }
}

const allLands = {
  White: { name: 'Plains', multiverseid: '73963'},
  Blue: { name: 'Island', multiverseid: '73951'},
  Black: { name: 'Swap', multiverseid: '73973'},
  Red: { name: 'Mountain', multiverseid: '73958'},
  Green: { name: 'Forest', multiverseid: '73946'}
}

const toNumber = x => +x
const sum = (x, y) => x + y
const diff = (x, y) => x - y
const and = (f, g) => x => f(x) && g(x)
const or = (f, g) => x => f(x) || g(x)

/** Returns true if the given card is not flipped or melded. */
const isFront = card => !card.names || card.name === card.names[0]
const allowed = card => BANNED.indexOf(card.name) === -1
const url = multiverseid => 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=' + multiverseid
const compareLands = (a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0

const generateBoard = allCards => {

  // choose colors
  const colors = sampleSize(ALL_COLORS, NUM_COLORS)
  const cards = filter(allCards, card => {
    return !card.colors ||
      !card.colors.length ||
      // every color of the card is in the player's colors
      card.colors.every(color => colors.indexOf(color) >= 0)
  })

  const spells = cards.filter(card => {
    return card.types.indexOf('Creature') === -1
      && card.types.indexOf('Land') === -1
      && card.types.indexOf('Artifact') === -1
  })
  const hand = sampleSize(spells, random(HAND_SIZE_MIN, HAND_SIZE_MAX))

  const creatures = sampleSize(
    filter(cards, card => card.types.indexOf('Creature') >= 0),
    random(BOARD_SIZE_MIN, BOARD_SIZE_MAX)
  )

  // get highest casting cost among creatures
  const maxCmc = creatures.map(prop('cmc')).reduce(binary(max))
  const numLands = Math.max(maxCmc, random(3, 6))

  const lands = sort(compareLands, [].concat(
    [allLands[colors[0]], allLands[colors[1]]],
    range(0, numLands - 2).map(() => allLands[sample(colors)])
  ))

  return { hand, creatures, lands, life: random(LIFE_MIN, LIFE_MAX) }
}

const render = () => {
  ReactDOM.render(
    r(Game, state),
    document.getElementById('app')
  )
}

// calculate the minimum damage that would get through for each player in
// an alpha strike, and set the other player's life above that value to
// eliminate trivial combat scenarios
const getAlpha = (creatures1, creatures2) => {
  const creatureDiff = creatures1.length - creatures2.length

  if(creatureDiff === 0) return 0

  // get storted creature powers
  const power1 = sort(diff, creatures1.map(pipe(prop('power'), toNumber)))
  const power2 = sort(diff, creatures2.map(pipe(prop('power'), toNumber)))

  return creatureDiff > 0
    ? power1.slice(0, creatureDiff).reduce(sum, 0)
    : -power2.slice(0, -creatureDiff).reduce(sum, 0)
}

// calculate the minimum damage that would get through for each player in
// an alpha strike, and set the other player's life above that value to
// eliminate trivial combat scenarios
const removeTrivialAttacks = state => {

  const alphaDiff = getAlpha(state.board1.creatures, state.board2.creatures)

  if(alphaDiff >= state.board2.life) {
    return state.board2.life = alphaDiff + random(0, MAX_ALPHA_BUFFER)
  }
  else if(-alphaDiff >= state.board1.life) {
    state.board1.life = -alphaDiff + random(0, MAX_ALPHA_BUFFER)
  }

  return state
}

/** Makes sure the lands are close to even between the two plyears. */
const equalizeLands = state => {

  const landDiff = state.board1.lands.length - state.board2.lands.length

  if(landDiff > 2) {
    state.board2.lands = state.board2.lands.concat(range(0, landDiff - 2).map(() => state.board2.lands[state.board2.lands.length-1]))
  }
  else if(landDiff < -2) {
    state.board1.lands = state.board1.lands.concat(range(0, -landDiff - 2).map(() => state.board1.lands[state.board1.lands.length-1]))
  }

  return state
}

/**************************************
 * Components
 **************************************/

const Game = ({ error, loading, board1, board2 }) => {
  return div({ className: 'game' }, [
    error ? div({ className: 'center' }, [
      div({ className: 'announcement' }, 'Ouch. Something broke.'),
      div({}, error.message)
    ]) :
    div({}, [
      loading ? div({ className: 'center announcement' }, [
        span({}, 'Loading'),
        span({ className: 'loading-ellipsis' }, repeat('.', loading.count))
      ]) : null,
      board1 ? div({ className: 'player' }, [
        r(Life, board1),
        div({ className: 'board1' }, [r(Board, {
          // omit opponent's hand
          creatures: board1.creatures,
          lands: board1.lands
        })])
      ]) : null,
      board2 ? div({ className: 'player' }, [
        hr(),
        r(Life, board2),
        div({ className: 'board2' }, [r(Board, board2)])
      ]) : null
    ]),
    !loading ? footer({}, [
      'made by raine. ',
      a({ href: GITHUB_SOURCE, target: '_blank' }, 'github')
    ]) : null
  ])
}

const Board = ({ hand, creatures, lands }) => {
  return div({ className: 'board' }, [
    creatures ? div({ className: 'creatures' }, creatures.map(card => r(Card, card))) : null,
    lands ? div({ className: 'lands' }, lands.map(card => r(Card, merge({}, card, { small: true })))) : null,
    hand ? div({}, [
      div({ className: 'hand-label' }, 'Hand'),
      div({ className: 'hand' }, hand.map(card => r(Card, card)))
    ]) : null
  ])
}

const Card = ({ small, name, imageUrl, multiverseid }) => {
  return img({
    className: ['card', small ? 'card-small' : ''].join(' '),
    alt: name,
    src: imageUrl || url(multiverseid)
  })
}

const Life = ({ life }) => {
  return div({ className: 'life' }, [
    div({ className: 'life-label' }, 'Life'),
    div({ className: 'life-value' }, life)
  ])
}

/**************************************
 * Main
 **************************************/

render()

const clock = setInterval(() => {
  if(!state.loading) {
    state.loading = { count: 0 }
  }
  else {
    state.loading.count++
    state.loading.count %= 4
  }
  render()
}, 300)

mtg.card.where({ set: 'EMN', pageSize: 500 }).then(allCards => {
  const cards = allCards.filter(and(isFront, allowed))
  clearInterval(clock)
  state.loading = null
  state.board1 = generateBoard(cards)
  state.board2 = generateBoard(cards)
  state = pipe(removeTrivialAttacks, equalizeLands)(state)
  render()
})
.catch(err => {
  clearInterval(clock)
  state.loading = null
  state.error = err
  render()
})
