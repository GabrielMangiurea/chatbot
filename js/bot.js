(function () {
  "use strict";

  var _mID = 0,
      storage = window.localStorage,
      minDelay = 250;

  function Bot (name) {
    var _id,
        _events = {},
        _this = this;

    this.prefix = null;
    this.name = this.prefix ? (this.prefix + " " + name) : name;
    this.userName = 'User';

    this.listening = true;
    this.talking = true;

    this.container = document.querySelector('.bot-container');

    this.delay = 500;

    this.executionMessage = false;
    this._firstResponse = false;

    this.actions = {
      changeName: function (newName) {
        var greet = ['It\'s a pleasure', 'My pleasure', 'Nice to meet you'];

        this.userName = newName;

        this.sendBotMessage(greet[Math.floor(Math.random() * greet.length)] + ', ' + this.userName + '!', null);
      },

      getLocation: function () {
        if ("geolocation" in navigator) {
          var _message = '';

          navigator.geolocation.getCurrentPosition(function(position) {
            if(window.open('https://www.google.com/maps/@' + position.coords.latitude + ',' + position.coords.longitude + ',17z')) {
              _message = 'You are around the following coordinates: ' + position.coords.latitude.toFixed(5) + ', ' + position.coords.longitude.toFixed(5) + '.<br>I opened Google Maps for you in another window.';
            } else {
              _message = 'You are around the following coordinates: ' + position.coords.latitude.toFixed(5) + ', ' + position.coords.longitude.toFixed(5) + '.<br>Your browser prevented me to open Google Maps. Please check the pop-up blocker.';
            }

            _this.sendBotMessage(_message);
          }, function(error) {
            _this.sendBotMessage('Sorry, but I couldn\'t determine your location.');
          });
        } else {
          _this.sendBotMessage('Sorry, but your current browser does not support Geolocation.');
        }
      },

      search: {
        google: function (query) {
          if(window.open('https://www.google.com/search?q=' + encodeURI(query))) {
            this.sendBotMessage('I searched on Google for "' + query + '" and opened a new window with the results.');
          } else {
            this.sendBotMessage('Your browser prevented me to open a new window with the results. Please check the pop-up blocker.');
          }
        },

        youtube: function (query) {
          if(window.open('https://www.youtube.com/results?search_query=' + encodeURI(query))) {
            this.sendBotMessage('I searched on Youtube for "' + query + '" and opened a new window with the results.');
          } else {
            this.sendBotMessage('Your browser prevented me to open a new window with the results. Please check the pop-up blocker.');
          }
        }
      },

      memory: {
        set: function (message) {        
          if (storage) {
            if (storage.getItem('aida-memory')) {
              this.sendBotMessage('There is something in my mind already...');
            } else {
              storage.setItem('aida-memory', message);
              this.sendBotMessage('I will remember that from now on.');
            }
          }
        },

        get: function () {
          if (storage) {
            if (storage.getItem('aida-memory')) {
              this.sendBotMessage('I remember you saying: ' + storage.getItem('aida-memory'));
            } else {
              this.sendBotMessage('I don\'t remember anything.');
            }
          }
        },

        erase: function () {
          if (storage) {
            storage.removeItem('aida-memory');
            this.sendBotMessage('My mind is clear now...');
          }
        },
      },

      listening: {
        start: function () {
          if (this.listening === true) {
            this.sendBotMessage('I am already listening...');
          } else {
            this.listening = true;
            this.sendBotMessage('I\'m listening...');
          }

          window.setTimeout(function () {
            annyang.start();
          }, 1000);
        },

        stop: function () {
          if (this.listening === false) {
            this.sendBotMessage('I stoppped listening some time ago...');
          } else {
            this.sendBotMessage('I will stop listening...');
            this.listening = false;
          }

          annyang.abort();
        }
      },

      talking: {
        start: function () {
          if (this.talking === true) {
            this.sendBotMessage('I am talking...');
          } else {
            this.talking = true;
            this.sendBotMessage('I will talk from now on.');
          }
        },

        stop: function () {
          if (this.talking === false) {
            this.sendBotMessage('I stopped talking some time ago...');
          } else {
            if(responsiveVoice.isPlaying) {
              responsiveVoice.cancel();
            }
            
            this.sendBotMessage('I will stop talking...');
            
            window.setTimeout(function () {
              _this.talking = false;
            }, 1000);
          }
        }
      }
    };

    this.reactsTo = [
      {pattern: /^(?:hello|hi)/i, reaction: ['Hello there!', 'Hi!', 'Greetings!']},
      {pattern: /(?:who|what) are you\??$/i, reaction: ['I am ' + this.name + ', a conversational bot.<br>I respond to a series of words or sentences like the ones above.']},
      {pattern: /tell me about yourself/i, reaction: ['I am ' + this.name + ', a conversational bot.<br>I respond to a series of words or sentences like the ones above.']},
      {pattern: /(?:how are you\??|what are you doing\??|what&#39;s up\??)/i, reaction: ['I\'m fine, thank you!', 'I am doing pretty well.', 'I\'m chatting with you.']},
      {pattern: /you(?:\&#39;re| are)(?:\s[a-z]+)?\s(nice|sweet|beautiful|awesome|great|super|epic)/i, reaction: ['Thank you!', 'That\'s very nice of you to say that!', 'No, you are ##1!']},
      {pattern: /gabriel mangiurea/i, reaction: ['Gabriel Mangiurea is my creator.<br>He is a web developer from Bucharest, Romania.<br>You can visit his website at <a href="https://gabrielmangiurea.github.io">gabrielmangiurea.github.io</a>.']},
      {pattern: /my name is ([a-zA-Z ]+)/i, reaction: {action: this.actions.changeName}},
      {pattern: /i am ([a-zA-Z ]+)/i, reaction: {action: this.actions.changeName}},
      {pattern: /(?:you can )?call me ([a-zA-Z ]+)/i, reaction: {action: this.actions.changeName}},
      {pattern: /where am i\??/i, reaction: {action: this.actions.getLocation}},
      {pattern: /search (?:(?:on )?(?:Google ))?for (.+)/i, reaction: {action: this.actions.search.google}},
      {pattern: /i want to (?:listen (?:to )?|watch )(.+)/i, reaction: {action: this.actions.search.youtube}},
      {pattern: /^remember this\:? (.+)/i, reaction: {action: this.actions.memory.set}},
      {pattern: /^i want you to remember this for me\:? (.+)/i, reaction: {action: this.actions.memory.set}},
      {pattern: /^what do you remember\??/i, reaction: {action: this.actions.memory.get}},
      {pattern: /^i want you to forget everything/i, reaction: {action: this.actions.memory.erase}},
      {pattern: /start listening/i, reaction: {action: this.actions.listening.start}},
      {pattern: /stop listening/i, reaction: {action: this.actions.listening.stop}},
      {pattern: /start talking/i, reaction: {action: this.actions.talking.start}},
      {pattern: /stop talking/i, reaction: {action: this.actions.talking.stop}}
    ];

    this.events = {
      emit: function (event, args) {
        if (!_events[event]) {
          return;
        }

        var registered = _events[event],
            l = registered ? registered.length : 0;

        while (l--) {
          registered[l]._cb(event, args);
        }

        return this.event;
      },

      register: function (event, cb) {
        if (!_events[event]) {
          _events[event] = [];
        }

        var _eID = (_id++).toString();

        _events[event].push({
          _eID: _eID,
          _cb: cb
        });

        return _eID;
      },

      unregister: function (id) {
        for (var i in _events) {
          if (_events[i]) {
            for (var ii = 0, ll = _events[i].length; ii < ll; ii++) {
              if (_events[i][ii] === id) {
                _events[i].splice(ii, 1);

                return id;
              }
            }
          }
        }
      }
    };
  }

  Bot.prototype.sendBotMessage = function (message, captured) {
    this.events.emit('message', {
      id: (_mID++),
      isBot: true,
      date: new Date(),
      message: (captured === null) ? message : message.replace(/##(\d)+/g, function (match) {
        return captured[match.replace('##', '') - 1].replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&').replace('&quot;', '"').replace('&#39;', '\'');
      })
    });
  };

  Bot.prototype.respond = function (question) {
    if (!question && !this._firstResponse) {
      this.sendBotMessage('Hello! I am ' + this.name + ', a conversational bot.<br>I respond to a series of words or sentences like the ones above.<br>Let\'s talk!');

      this._firstResponse = true;

    } else if (question && this._firstResponse) {
      for (var i = 0, l = this.reactsTo.length; i < l; i++) {
        var _r = this.reactsTo[i],
            _m = _r.pattern.exec(question),
            queue = [];

        if (_r.pattern && _m) {
          var isObject = (typeof _r.reaction === 'object' ? true : false),
              isArray  = Array.isArray(_r.reaction),
              args = [];

          for (var key in _m) {
            if (key > 0) {
              args.push(_m[key]);
            }
          }

          if (isObject && !isArray) { 
            if (!_r.reaction.action) {
              console.error((this.prefix ? this.prefix : '[BOT] ') + 'Error: supply a function for ' + _r.pattern + '!');
              return;
            } else {
              this.events.emit('action', {
                action: _r.reaction.action,
                params: (args.length > 1) ? args : args[0]
              });
            }
          } else if (isObject && isArray) {
            if (!_r.reaction.length) {
              console.error((this.prefix ? this.prefix : '[BOT] ') + 'Error: supply a response for ' + _r.pattern + '!');
              return;
            } else {
              this.sendBotMessage(_r.reaction[Math.floor(Math.random() * _r.reaction.length)], 
                                  (args.length < 1) ? null : args);
            }
          } else {
            return;
          }
        }
      }

      if (this.reactsTo.filter(function (el) {
        return el.pattern.test(question);
      }) == false) {
        var sentences = ['I am currently limited in what I can say.<br>I think I\'ll need an upgrade in the near future.', 'Sorry, but I couldn\'t understand. Can you repeat, please?'];

        this.sendBotMessage(sentences[Math.floor(Math.random() * sentences.length)]);
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var _delay;
    var _bot = new Bot('Aida');
    var _form = _bot.container.querySelector('form'),
        userInput = _form.querySelector('input[type="text"]'),
        submitBtn = _form.querySelector('input[type="submit"]');

    _bot.events.register('action', function (ev, data) {
      var action = data.action,
          params = data.params;

      window.setTimeout(function () {
        if (typeof data.params !== 'object') {
          action.bind(_bot).call(null, params);
        } else {
          action.bind(_bot).apply(null, params);
        }
      }, _bot.delay);

      if (_bot.executionMessage) {
        _bot.sendBotMessage('I just called ' + action.name + '() function with the following parameters: ' + params.join(', '));
      }
    });

    _bot.events.register('message', function (ev, data) {
      _bot.events.emit('updateUI', {
        id: data.id,
        isBot: data.isBot,
        date: data.date,
        name: data.isBot ? _bot.name : _bot.userName,
        message: data.message
      });

      annyang.abort();
    });

    _bot.events.register('updateUI', function (ev, data) {
      var _view = _bot.container.querySelector('.view');

      if(!_view) {
        return;
      }

      window.setTimeout(function () {
        var element = document.createElement('p');
        element.setAttribute('data-id', data.id);
        element.className = 'conversation ' + (data.isBot ? 'bot' : 'user');

        element.innerHTML += '<span class="name">' + data.name + '</span>' +
          '<span class="message">' + data.message + '</span>' +
          '<span class="timestamp">' + data.date.toLocaleString() + '</span>';

        _view.appendChild(element);
        _view.scrollTop = _view.scrollHeight - _view.clientHeight;
        window.scrollTop = window.scrollHeight - window.clientHeight;

        if (responsiveVoice.voiceSupport()) {
          if (_bot.talking) {
            if (data.isBot === true) {
              responsiveVoice.speak(data.message.replace(/<(.|\n)*?>/g, ' '), 'UK English Female', {onend: function () {
                                                                                                      annyang.start();
                                                                                                    }
                                                                                                   }
              );
            }
          } else {
            annyang.start();
          }
        }

        if (data.isBot) {
          _bot.events.emit('unlockUI');
        }

      }, (!_bot._firstResponse ? minDelay : (data.isBot ? (_delay = (Math.floor(Math.random() * (data.message.length * 45) +  _bot.delay/2))) : 1)));
    });

    _bot.events.register('lockUI', function () {
      userInput.disabled = true;
      userInput.value = 'Waiting for ' + _bot.name + ' to respond...';
      submitBtn.disabled = true;
    });

    _bot.events.register('unlockUI', function () {
      userInput.disabled = false;
      userInput.value = '';
      userInput.focus();
      submitBtn.disabled = false;
    });

    _bot.respond();

    _form.addEventListener('submit', function (e) {
      e.preventDefault();

      var userMessage  = userInput.value.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;').replace(/\"/g, '&quot;').replace(/\'/g, '&#39;');

      if (userMessage === '') {
        return;
      }

      _bot.events.emit('message', {
        id: (_mID++),
        isBot: false,
        date: new Date(),
        message: userMessage
      });

      _bot.events.emit('lockUI');

      _bot.respond(userMessage);
    });

    if(annyang && _bot.listening == true) {
      var annyangCommands = {
        '*voiceCommand': sendToBot
      };

      annyang.addCommands(annyangCommands);

      if (responsiveVoice.isPlaying == false) {
        annyang.start();
      }
    }

    function sendToBot(voiceCommand) {
      _bot.events.emit('message', {
        id: (_mID++),
        isBot: false,
        date: new Date(),
        message: voiceCommand
      });

      _bot.events.emit('lockUI');

      _bot.respond(voiceCommand);
    }
  });

})();