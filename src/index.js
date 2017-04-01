'use strict';
const
  got = require('got')

, icon = require('../icon.png')

, {HOTEL_HOST = 'http://127.0.0.1:2000', TLD = 'dev'} = process.env

, ENDPOINT = `${HOTEL_HOST}/_/servers`

, TAB_CODE = 9

, keyword = 'hotel'

, pipe = (...fs) => y => fs.reduce((x, f) => f(x), y)

, compose = (...fs) => pipe(...fs.reverse())

, map = f => xs => xs.map(f)

, prop = p => o => o[p]

, serversToList = obj =>
    Object.keys(obj).map(id => Object.assign({}, obj[id], {id}))

, isRunning = status => status === 'running'

, toggle = ({id, status}) =>
    got.post(`${ENDPOINT}/${id}/${isRunning(status) ? 'stop' : 'start'}`)

, serverToResult = scope => server => {
    const
      {id, status} = server
    , running = isRunning(status)
    , url = { http: `${HOTEL_HOST}/${id}`
            , proxy: `http://${id}.${TLD}`
            }

    return {
      icon
    , id: url.proxy
    , title: `${id} [${running ? 'On' : 'Off'}]`
    , subtitle: 'Tab to toggle. Enter to open URL. Shift+Enter to open real URL.'
    , clipboard: url.proxy
    , onSelect(event) {
        if (!running) toggle(server)
        scope.actions.open(event.tabKey ? url.http : url.proxy)
      }
    , onKeyDown(event) {
        if (event.keyCode !== TAB_CODE) return;
        event.preventDefault()

        toggle({id, status}).then(() => {
          const
            nextStatus = running ? 'stopped' : 'running'
          , next = serverToResult(scope)({id, status: nextStatus})

          scope.update(url.proxy, next)
        })
      }
    }
  }

, fn = ({term, display, actions, update}) => {
    if (!term.match(/^hotel/)) return;

    got(ENDPOINT)
      .then(pipe( compose(JSON.parse, prop('body'))
                , serversToList
                , map(serverToResult({update, actions}))
                , display
                ))
  }

module.exports = {
  keyword,
  icon,
  name: 'Manage Hotel applications',
  fn
}
