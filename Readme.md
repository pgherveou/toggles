# toggles

  on/off or multistate (work in progress) toggles inspired by ratchet toggles

## Installation

    $ component install pgherveou/toggles

## API

```js
var Toggles = require('toggles')
  , el = document.querySelector('.toggle')
  , toggles = new Toggles(el);

toggles.on('toggle', function (state) {
  console.log('toggled?', state.isActive);
});
```

## License

  MIT



