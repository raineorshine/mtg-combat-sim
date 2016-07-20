import 'babel-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import * as mtg from 'mtgsdk'
const r = require('r-dom')
import { div, img, hr, span } from 'r-dom'
import { filter, random, repeat, sampleSize } from 'lodash'
import { merge, propEq } from 'ramda'

const ALL_COLORS = ['White', 'Blue', 'Black', 'Red', 'Green']
const NUM_COLORS = 2
const HAND_SIZE_MIN = 2
const HAND_SIZE_MAX = 4
const BOARD_SIZE_MIN = 2
const BOARD_SIZE_MAX = 4
const LIFE_MIN = 1
const LIFE_MAX = 20

const log = console.log.bind(console)

let state = {
  loading: { count: 0 }
}

const generateBoard = allCards => {

  // choose colors
  const colors = sampleSize(ALL_COLORS, NUM_COLORS)
  const cards = filter(allCards, card => {
    return !card.colors ||
      !card.colors.length ||
      // every color of the card is in the player's colors
      card.colors.every(color => colors.indexOf(color) >= 0)
  })

  const hand = sampleSize(cards, random(HAND_SIZE_MIN, HAND_SIZE_MAX))

  const creatures = sampleSize(
    filter(cards, card => card.types.indexOf('Creature') >= 0),
    random(BOARD_SIZE_MIN, BOARD_SIZE_MAX)
  )

  const lands = []
  // const lands = sampleSize(
  //   filter(cards, propEq('type', 'land')),
  //   5//random(HAND_SIZE_MIN, HAND_SIZE_MAX+1))
  // )

  return { hand, creatures, lands, life: random(LIFE_MIN, LIFE_MAX) }
}

const render = () => {

  const { loading, board1, board2 } = state

  ReactDOM.render(
    r(Game, { loading, board1, board2 }),
    document.getElementById('app')
  )
}

/**************************************
 * Components
 **************************************/

const Game = ({ loading, board1, board2 }) => {
  return div({ className: 'game' }, [
    loading ? div({ className: 'loading' }, [
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
  ])
}

const Board = ({ hand, creatures, lands }) => {
  return div({ className: 'board' }, [
    creatures ? div({ className: 'creatures' }, creatures.map(card => r(Card, card))) : null,
    lands ? div({ className: 'lands' }, lands.map(card => r(Card, card))) : null,
    hand ? div({}, [
      div({ className: 'hand-label' }, 'Hand'),
      div({ className: 'hand' }, hand.map(card => r(Card, card)))
    ]) : null
  ])
}

const Card = ({ name, imageUrl }) => {
  return img({
    className: 'card',
    alt: name,
    src: imageUrl
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

mtg.card.where({ set: 'EMN', pageSize: 500 }).then(cards => {
  clearInterval(clock)
  state.loading = null
  state.board1 = generateBoard(cards)
  state.board2 = generateBoard(cards)
  render()
})
