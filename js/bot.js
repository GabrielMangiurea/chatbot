(function () {
  "use strict";

  var _mID = 0,
      storage = window.localStorage,
      minDelay = 250,
      awaitingConfirmation = false;

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
    this.commandQueue = {};
    this._firstResponse = false;

    this.actions = {
      changeName: function (newName) {
        var greet = ['It\'s a pleasure', 'My pleasure', 'Nice to meet you'];

        this.userName = newName;

        this.sendBotMessage(greet[Math.floor(Math.random() * greet.length)] + ', ' + this.userName + '!', null);
      },

      getDay: {
        today: function () {
          var dateObject = new Date();
          this.sendBotMessage('Today is ' + this.actions.getDay.calculateDay(dateObject.getDay()) + '.');
        },

        date: function (date) {
          var dateObject = new Date(date),
              today = new Date();

          if (dateObject == "Invalid Date") {
            this.sendBotMessage('This is an invalid date...');
          }

          else {
            if (dateObject.getYear() < today.getYear()) {
              this.sendBotMessage('It was ' + this.actions.getDay.calculateDay(dateObject.getDay()) + ' on ' + date + '.');
            } 

            else if (dateObject.getYear() > today.getYear()) {
              this.sendBotMessage('It will be ' + this.actions.getDay.calculateDay(dateObject.getDay()) + ' on ' + date + '.');
            }

            else {
              this.sendBotMessage('Today is ' + this.actions.getDay.calculateDay(dateObject.getDay()) + '.');
            }
          }
        },

        calculateDay: function (integer) {
          switch (integer) {
            case 0: return "Sunday";
            case 1: return "Monday";
            case 2: return "Tuesday";
            case 3: return "Wednesday";
            case 4: return "Thursday";
            case 5: return "Friday";
            case 6: return "Saturday";
          }
        }
      },

      getLocation: function () {
        if ("geolocation" in navigator) {
          var _message = '';

          navigator.geolocation.getCurrentPosition(function(position) {
            if(window.open('https://www.google.com/maps/@' + position.coords.latitude + ',' + position.coords.longitude + ',17z')) {
              _message = 'You are around the following coordinates: ' + position.coords.latitude.toFixed(5) + ', ' + position.coords.longitude.toFixed(5) + '.<br>I opened Google Maps for you in another window.';
            } else {
              _message = 'You are around the following coordinates: ' + position.coords.latitude.toFixed(5) + ', ' + position.coords.longitude.toFixed(5) + '.<br>I couldn\'t open Google Maps. Please check your browser settings.';
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
            this.sendBotMessage('I couldn\'t open a new window with the results. Please check your browser settings.');
          }
        },

        youtube: function (query) {
          if(window.open('https://www.youtube.com/results?search_query=' + encodeURI(query))) {
            this.sendBotMessage('I searched on Youtube for "' + query + '" and opened a new window with the results.');
          } else {
            this.sendBotMessage('I couldn\'t open a new window with the results. Please check your browser settings.');
          }
        },

        wikipedia: function (query) {
          $.ajax({
            type: "GET",
            url: "http://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&titles=" + encodeURIComponent(query) + "&redirects=1&utf8=1&ascii=1&formatversion=2&exsentences=20&callback=?",
            contentType: "application/json; charset=utf-8",
            async: false,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
              _this.sendBotMessage(data.query.pages[0].extract.replace(/<(.|\n)*?>/g, '').replace(/\(.+\)/g, ''));
            },
            error: function (error) {
              console.log("Wikipedia API Error: " + error);
            }
          });
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
          if (!annyang) {
            this.sendBotMessage('I am having trouble listening on this browser. I suggest you to use Google Chrome.');
            return;
          }

          if (this.listening === true) {
            this.sendBotMessage('I am already listening...');
          } else {
            this.listening = true;
            this.sendBotMessage('I\'m listening...');
          }
        },

        stop: function () {
          if (!annyang) {
            this.sendBotMessage('I am having trouble listening on this browser. I suggest you to use Google Chrome.');
            return;
          }

          if (this.listening === false) {
            this.sendBotMessage('I stoppped listening some time ago...');
          } else {
            this.sendBotMessage('I will stop listening...');
            this.listening = false;

            annyang.abort();
          }
        }
      },

      talking: {
        start: function () {
          if (responsiveVoice.voiceSupport() == false) {
            this.sendBotMessage('I am having trouble talking on this browser. I suggest you to use Google Chrome.');
            return;
          }

          if (this.talking === true) {
            this.sendBotMessage('I am talking...');
          } else {
            if (annyang && annyang.isListening()) {
              annyang.abort();
            }

            this.talking = true;
            this.sendBotMessage('I will talk from now on.');
          }
        },

        stop: function () {
          if (responsiveVoice.voiceSupport() == false) {
            this.sendBotMessage('I am having trouble talking on this browser. I suggest you to use Google Chrome.');
            return;
          }

          if (this.talking === false) {
            this.sendBotMessage('I stopped talking some time ago...');
          } else {
            if(responsiveVoice.isPlaying()) {
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
      {pattern: /^(?:hello|hi)/i, reaction: ['Hello there!', 'Hi!', 'Greetings!'], description: 'to greet me', confirm: false, special: false},
      {pattern: /(?:who|what) are you\??$/i, reaction: ['I am ' + this.name + ', a conversational bot.<br>I respond to a series of words or sentences like the ones above.'], description: 'to ask me who I am', confirm: false, special: false},
      {pattern: /tell me about yourself/i, reaction: ['I am ' + this.name + ', a conversational bot.<br>I respond to a series of words or sentences like the ones above.'], description: 'to ask me who I am', confirm: false, special: false},
      {pattern: /(?:how are you\??|what are you doing\??)/i, reaction: ['I\'m fine, thank you!', 'I am doing pretty well.', 'I\'m chatting with you.'], description: 'to ask me how I feel', confirm: false, special: false},
      {pattern: /you are(?:\s[a-z]+)?\s(nice|sweet|beautiful|awesome|great|super|epic)/i, reaction: ['Thank you!', 'That\'s very nice of you to say that!', 'You are ##1!'], description: 'to compliment me', confirm: false, special: false},
      {pattern: /gabriel mangiurea/i, reaction: ['Gabriel Mangiurea is my creator.<br>He is a web developer from Bucharest, Romania.<br>You can visit his website at <a href="https://gabrielmangiurea.github.io">gabrielmangiurea.github.io</a>.'], description: 'to ask about my creator', confirm: false, special: false},
      {pattern: /my name is ([a-zA-Z ]+)/i, reaction: {action: this.actions.changeName}, description: 'me to change your name', confirm: false, special: false},
      {pattern: /i am ([a-zA-Z ]+)/i, reaction: {action: this.actions.changeName}, description: 'me to change your name', confirm: false, special: false},
      {pattern: /(?:you can )?call me ([a-zA-Z ]+)/i, reaction: {action: this.actions.changeName}, description: 'me to change your name', confirm: false, special: false},
      {pattern: /what day is (?:today|this day|it)\??/i, reaction: {action: this.actions.getDay.today}, description: 'me to say the day', confirm: false, special: false},
      {pattern: /what day (?:was|will be) on ([a-z0-9\.\,\- ]+)\??/i, reaction: {action: this.actions.getDay.date}, description: 'me to say the day', confirm: false, special: false},
      {pattern: /where am i\??/i, reaction: {action: this.actions.getLocation}, description: 'me to find your location', confirm: false, special: false},
      {pattern: /search (?:(?:on )?(?:Google ))?for (.+)/i, reaction: {action: this.actions.search.google}, description: 'me to search on Google', confirm: false, special: false},
      {pattern: /i want to (?:listen (?:to )?|watch )(.+)/i, reaction: {action: this.actions.search.youtube}, description: 'me to search on Youtube', confirm: false, special: false},
      {pattern: /wiki (.+)/i, reaction: {action: this.actions.search.wikipedia}, description: 'me to search on Wikipedia', confirm: false, special: false},
      {pattern: /^remember this\:? (.+)/i, reaction: {action: this.actions.memory.set}, description: 'me to remember something', confirm: false, special: false},
      {pattern: /^i want you to remember this for me\:? (.+)/i, reaction: {action: this.actions.memory.set}, description: 'me to remember something', confirm: false, special: false},
      {pattern: /^what do you remember\??/i, reaction: {action: this.actions.memory.get}, description: 'to ask me about my memories', confirm: false, special: false},
      {pattern: /^i want you to forget everything/i, reaction: {action: this.actions.memory.erase}, description: 'me to erase my memory', confirm: true, special: false},
      {pattern: /start listening/i, reaction: {action: this.actions.listening.start}, description: 'me to start listening you', confirm: false, special: false},
      {pattern: /stop listening/i, reaction: {action: this.actions.listening.stop}, description: 'me to stop listening you', confirm: false, special: false},
      {pattern: /start talking/i, reaction: {action: this.actions.talking.start}, description: 'me to start talking', confirm: false, special: false},
      {pattern: /stop talking/i, reaction: {action: this.actions.talking.stop}, description: 'me to stop talking', confirm: false, special: false},
      {pattern: /(?:\b)(?:yes|no)(?:\b)/i, reaction: null, description: null, confirm: false, special: true}
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

          if  (_r.special) {
            if (this.commandQueue.action && this.commandQueue.args) {
              switch (_m[0].toLowerCase()) {
                case 'yes':
                  this.events.emit('action', {
                    action: this.commandQueue.action,
                    params: (this.commandQueue.args.length > 1) ? this.commandQueue.args : this.commandQueue.args[0]
                  });
                  break;

                case 'no':
                  this.sendBotMessage('Let\'s continue chatting then...');
                  break;

                default:
                  this.sendBotMessage('Please confirm your desired action, next time!');
                  break;
              }

              this.commandQueue = {};
              awaitingConfirmation = false;

            } else {
              this.sendBotMessage('What are you trying to confirm?');
            }

          } else {
            if (awaitingConfirmation) {
              this.sendBotMessage('Please confirm your desired action...');
            } else {
              if (isObject && !isArray) { 
                if (!_r.reaction.action && !_r.special) {
                  console.error((this.prefix ? this.prefix : '[BOT] ') + 'Error: supply a function for ' + _r.pattern + '!');
                  return;
                } else {
                  if (!_r.confirm) {
                    this.events.emit('action', {
                      action: _r.reaction.action,
                      params: (args.length > 1) ? args : args[0]
                    });
                  } else {
                    this.sendBotMessage('Are you sure that you want ' + _r.description + '?');
                    this.commandQueue.action = _r.reaction.action;
                    this.commandQueue.args = args;
                    awaitingConfirmation = true;
                  }
                }
              } else if (isObject && isArray) {
                if (!_r.reaction.length && !_r.special) {
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

      if (annyang && annyang.isListening()) {
        annyang.abort();
      }  
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
              responsiveVoice.speak(
                data.message.replace(/<(.|\n)*?>/g, ' '),
                'UK English Female',
                {onend: function () {
                  if (_bot.listening) {
                    annyang.start();
                  }
                }}
              );
            }
          } else {
            if (_bot.listening && _bot._firstResponse) {
              annyang.start();
            }  
          }
        }

        if (data.isBot) {
          _bot.events.emit('unlockUI');
        }

      }, (!_bot._firstResponse ? minDelay : (data.isBot ? (_delay = (Math.floor(Math.random() * (data.message.length * 30) +  _bot.delay/2))) : 1)));
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

    if(annyang) {
      annyang.addCommands({'*voiceCommand': sendToBot});
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