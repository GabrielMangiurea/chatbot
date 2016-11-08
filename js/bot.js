(function () {
  "use strict";

  var _mID = 0;

  function Bot (name) {
    var _id,
        _events = {};

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

        this.sendBotMessage(greet[Math.floor(Math.random() * greet.length)] + ', ' + this.userName + '!');
      },

      getLocation: function () {
        var _this = this;

        if ("geolocation" in navigator) {
          var _message = '';

          navigator.geolocation.getCurrentPosition(function(position) {
            if(window.open('https://www.google.com/maps/@' + position.coords.latitude + ',' + position.coords.longitude + ',17z')) {
              _message = 'You are around the following coordinates: ' + position.coords.latitude.toFixed(5) + ', ' + position.coords.longitude.toFixed(5) + '.<br>I opened Google Maps for you in another window.';
            } else {
              _message = 'You are around the following coordinates: ' + position.coords.latitude.toFixed(5) + ', ' + position.coords.longitude.toFixed(5) + '.';
            }

            _this.sendBotMessage(_message);
          }, function(error) {
            _this.sendBotMessage('Sorry, but I couldn\'t determine your location.');
          });
        } else {
          _this.sendBotMessage('Sorry, but your current browser does not support Geolocation.');
        }
      },

      searchGoogle: function (query) {
        if(window.open('https://www.google.com/search?q=' + encodeURI(query))) {
          this.sendBotMessage('I searched on Google for "' + query + '" and opened a new window with the results.');
        } else {
          this.sendBotMessage('Your browser does not allow me to open a new window with the results. Please check your pop-up blocker.');
        }
      },

      searchYoutube: function (query) {
        if(window.open('https://www.youtube.com/results?search_query=' + encodeURI(query))) {
          this.sendBotMessage('I searched on Youtube for "' + query + '" and opened a new window with the results.');
        } else {
          this.sendBotMessage('Your browser does not allow me to open a new window with the results. Please check your pop-up blocker.');
        }
      },
      
      startListening: function () {
        if (this.listening === true) {
          this.sendBotMessage('I already listen...');
        } else {
          this.listening = true;
          this.sendBotMessage('I\'m listening...');
        }
      },
      
      stopListening: function () {
        if (this.listening === false) {
          this.sendBotMessage('I stoppped listening some time ago...');
        } else {
          this.listening = false;
          this.sendBotMessage('I will stop listening...');
        }
      },
      
      startTalking: function () {
        if (this.talking === true) {
          this.sendBotMessage('I am talking...')
        } else {
          this.talking = true;
          this.sendBotMessage('I will talk from now on.');
        }
      },
      
      stopTalking: function () {
        if (this.talking === false) {
          this.sendBotMessage('I stopped talking some time ago...');
        } else {
          if(responsiveVoice.isPlaying()) {
            responsiveVoice.cancel();
          }
          
          this.talking = false;
          this.sendBotMessage('I will stop talking...');
        }
      }
    }

    this.reactsTo = [
      {pattern: /(?:\b)(?:hello|hi)(?:\b)/i, reaction: ['Hello there!', 'Hi!', 'Greetings!']},
      {pattern: /(?:who|what) are you\?$/i, reaction: ['I am ' + this.name + ', a conversational bot.<br>I respond to a series of words or sentences like the ones above.']},
      {pattern: /tell me about yourself/i, reaction: ['I am ' + this.name + ', a conversational bot.<br>I respond to a series of words or sentences like the ones above.']},
      {pattern: /(?:how are you\??|what are you doing\??|what&#39;s up\?)/i, reaction: ['I\'m fine, thank you!', 'I am doing pretty well.', 'I\'m chatting with you.']},
      {pattern: /gabriel mangiurea/i, reaction: ['Gabriel Mangiurea is my creator.<br>He is a web developer from Bucharest, Romania.<br>You can visit his website at <a href="https://gabrielmangiurea.github.io">gabrielmangiurea.github.io</a>.']},
      {pattern: /my name is ([a-zA-Z ]+)/i, reaction: {action: this.actions.changeName}},
      {pattern: /i am ([a-zA-Z ]+)/i, reaction: {action: this.actions.changeName}},
      {pattern: /(?:you can )?call me ([a-zA-Z ]+)/i, reaction: {action: this.actions.changeName}},
      {pattern: /where am i\??/i, reaction: {action: this.actions.getLocation}},
      {pattern: /search (?:(?:on )?(?:Google ))?for (.+)/i, reaction: {action: this.actions.searchGoogle}},
      {pattern: /i want to (?:listen (?:to )?|watch )(.+)/i, reaction: {action: this.actions.searchYoutube}},
      {pattern: /start listening/i, reaction: {action: this.actions.startListening}},
      {pattern: /stop listening/i, reaction: {action: this.actions.stopListening}},
      {pattern: /start talking/i, reaction: {action: this.actions.startTalking}},
      {pattern: /stop talking/i, reaction: {action: this.actions.stopTalking}}
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
  
  Bot.prototype.sendBotMessage = function (message) {
    this.events.emit('message', {
      id: (_mID++),
      isBot: true,
      date: new Date(),
      message: message
    });
  }
  
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
              isArray  = Array.isArray(_r.reaction);

          if (isObject && !isArray) { 
            if (!_r.reaction.action) {
              console.error((this.prefix ? this.prefix : '[BOT] ') + 'Error: supply a function for ' + _r.pattern + '!');
              return;
            } else {
              this.events.emit('action', {
                action: _r.reaction.action,
                params: _m.slice(1)
              });
            }
          } else if (isObject && isArray) {
            if (!_r.reaction.length) {
              console.error((this.prefix ? this.prefix : '[BOT] ') + 'Error: supply a response for ' + _r.pattern + '!');
              return;
            } else {
              this.sendBotMessage(_r.reaction[Math.floor(Math.random() * _r.reaction.length)]);
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

        this.sendBotMessage(sentences[Math.floor(Math.random() * sentences.length)])
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var _delay;
    var _bot = new Bot('Aida');

    _bot.events.register('action', function (ev, data) {
      var action = data.action,
          params = data.params;

      window.setTimeout(function () {
        action.bind(_bot).apply(null, params);
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
        
        if (responsiveVoice.voiceSupport()) {
          if (_bot.talking && (data.isBot === true)) {
            responsiveVoice.speak(data.message.replace(/<(.|\n)*?>/g, ' '), 'UK English Female');
          }
        }
        
      }, (!_bot._firstResponse ? 250 : (data.isBot ? (_delay = (Math.floor(Math.random() * (data.message.length * 45) +  _bot.delay/2))) : 1)));
    });

    _bot.respond();

    var _form = _bot.container.querySelector('form');

    _form.addEventListener('submit', function (e) {
      e.preventDefault();

      var userInput    = _form.querySelector('input[type="text"]'),
          userMessage  = userInput.value.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;').replace(/\"/g, '&quot;').replace(/\'/g, '&#39;'),
          submitBtn    = _form.querySelector('input[type="submit"]');

      if (userMessage === '') {
        return;
      }

      userInput.disabled = true;
      userInput.value = 'Waiting for ' + _bot.name + ' to respond...';
      submitBtn.disabled = true; 

      _bot.events.emit('message', {
        id: (_mID++),
        isBot: false,
        date: new Date(),
        message: userMessage
      });

      _bot.respond(userMessage);

      window.setTimeout(function () {
        userInput.disabled = false;
        userInput.value = '';
        userInput.focus();
        submitBtn.disabled = false;
      }, (_delay ? _delay : _bot.delay));
    });

    if(annyang && _bot.listening) {
      var annyangCommands = {
        '*voiceCommand': sendToBot
      }

      annyang.addCommands(annyangCommands);
      annyang.start();
    }

    function sendToBot(voiceCommand) {
      _bot.events.emit('message', {
        id: (_mID++),
        isBot: false,
        date: new Date(),
        message: voiceCommand
      });
      
      _bot.respond(voiceCommand);
    }
  });

})();