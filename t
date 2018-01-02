var options = {}
;
load()
;
function copy(element) {
  select(element);
  document.execCommand("copy");
  unselect();
  element.style.visibility = 'hidden';
//  element.style.visibility = 'visible';
  document.getElementById('copied').style.display = 'block';
  setTimeout(()=>
    document.getElementById('copied').style.display = 'none'
  , 7777);
}
function select(element) {
    var range, selection
    ;
    if (document.body.createTextRange) { //ms
        range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
        return 1;
    } else if (window.getSelection) { //all others
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        return 1;
    }
    return 0; //selection.toString() || range.toString();
}
function unselect() {
  if (window.getSelection) {
    if (window.getSelection().empty) {  // Chrome
      window.getSelection().empty();
    } else if (window.getSelection().removeAllRanges) {  // Firefox
      window.getSelection().removeAllRanges();
    }
    return 1;
  } else if (document.selection) {  // IE?
    document.selection.empty();
    return 1;
  }
  return 0;
}
var e = document.getElementById('code');
e.innerText = e.innerText.replace(
  /[?]s/,
  '?' + (options.user ? 'u=' + options.user + '&' :  'r=' + options.ref + '&') + 's'
)
;
!options.preserve && window.history.pushState({}, "leat.io M", "/m")
;
document.getElementById('user-name').textContent = options.user || "\xa0".repeat(17)
;
options.hidelogo && (document.getElementById('branding').style.display = 'none')
;
options.hide || (
	document.getElementById('miner').style.display = 'block'
)
;
// Set colors
var extraStyles = '';
if (options.background) {
	extraStyles += 'body { background-color: #'+options.background.replace(/\W+/g,'')+'; }';
	extraStyles += '#mining-buttons-overlay { background-color: #'+options.background.replace(/\W+/g,'')+'; }';
}
if (options.text) {
	extraStyles += 'body { color: #'+options.text.replace(/\W+/g,'')+'; }';
}
if (options.color) {
	extraStyles += 'a, .action { color: #'+options.color.replace(/\W+/g,'')+';}' +
		'.mining-icon .mining-stroke { stroke: #'+options.color.replace(/\W+/g,'')+'; }'+
		'.mining-icon .mining-fill { fill: #'+options.color.replace(/\W+/g,'')+'; };'
}
if (extraStyles.length) {
	document.getElementById('extra-styles').innerHTML = extraStyles;
}
var graphColor = '#' + (options.graph || 'aaa')
;
options.starttext && options.starttext.length && (document.getElementById('mining-button-text').textContent = starttext);

options.powermode && (document.getElementById('power-mode').textContent = options.powermode);


var MinerUI = function(miner, graphColor, elements) {
	var interval, timer
	;
	const powerMode = x => {
    if(x === 0) {
      clearInterval(interval);
      clearTimeout(timer);
      return this._powerMode = 0;
    }
		this._powerMode = (+x || 0);
		clearInterval(interval);
		miner.start(leatMine.FORCE_EXCLUSIVE_TAB);
		interval = setInterval(()=> {
			miner.start(leatMine.FORCE_EXCLUSIVE_TAB);
			clearTimeout(timer);
			timer = setTimeout(()=> {
				miner.stop();
			}, 6e4);
		}, (this._powerMode) * 6e4 + 6e4);
	}
	;
	Object.defineProperty(this, 'powerMode', {
		set(x) { powerMode(x) },
		get() { return this._powerMode || 'Off' }
	})
	;
	options.powermode && powerMode(options.powermode)
	;
	this.miner = miner;
	this.graphColor = graphColor;
	this.elements = elements;

	this.intervalUpdateStats = 0;
	this.intervalDrawGraph = 0;

	this.ctx = this.elements.canvas.getContext('2d');

	this.elements.startButton.addEventListener('click', this.start.bind(this));
	this.elements.stopButton.addEventListener('click', this.stop.bind(this));

	this.elements.threadsAdd.addEventListener('click', this.addThread.bind(this));
	this.elements.threadsRemove.addEventListener('click', this.removeThread.bind(this));

	this.elements.speedUp.addEventListener('click', this.speedUp.bind(this));
	this.elements.speedDown.addEventListener('click', this.speedDown.bind(this));

	this.elements.powerModeUp.addEventListener('click', this.powerModeUp.bind(this));
	this.elements.powerModeDown.addEventListener('click', this.powerModeDown.bind(this));


	this.stats = [];
	for (let i = 0, x = 0; x < 300; +i, x += 5) {
		this.stats.push({hashes: 0, accepted: 0});
	}

	this.didAcceptHash = false;
	if (this.miner) {
		this.miner.on('accepted', function(){
			this.didAcceptHash = true;
		}.bind(this));
	}

	this.elements.threads.textContent = this.miner.getNumThreads();
	this.elements.speed.textContent = Math.round((1-this.miner.getThrottle()) * 100) + '%';

};
MinerUI.prototype.check = function () {
  if(!this.miner.isRunning() && window._running) {
    this.miner.start(leatMine.FORCE_EXCLUSIVE_TAB);
    if(!this.miner.isRunning()) {
      location.href = location.pathname;
    }
  }
}

MinerUI.prototype.start = function(ev) {
	ev && ev.preventDefault();

	options.lock = options.lock || 77777;
	window._running = setInterval(this.check.bind(this), options.lock);
	if(!this.miner) {
		return false;
	}

	this.elements.startButton.style.display = 'none';
	this.miner.start(leatMine.FORCE_EXCLUSIVE_TAB);
	this.elements.container.classList.add('running');
	this.elements.container.classList.remove('stopped');
	this.intervalUpdateStats = setInterval(this.updateStats.bind(this), (+options.interval || 500) / 10);
	this.intervalDrawGraph = setInterval(this.drawGraph.bind(this), +options.interval || 500);

	this.elements.threads.textContent = this.miner.getNumThreads();

	return false;
};

MinerUI.prototype.stop = function(ev) {
        clearInterval(this._running);
        delete this._running;
	this.miner.stop();
	this.elements.hashesPerSecond.textContent = 0;
	this.elements.container.classList.remove('running');
	this.elements.container.classList.add('stopped');

	clearInterval(this.intervalUpdateStats);
	clearInterval(this.intervalDrawGraph);

  this.elements.startButton.style.display = 'block';

	ev && ev.preventDefault();
	return false;
};

MinerUI.prototype.addThread = function(ev) {
	this.miner.setNumThreads(this.miner.getNumThreads() + 1);
	this.elements.threads.textContent = this.miner.getNumThreads();
	this.storeDefaults();

	ev.preventDefault();
	return false;
};

MinerUI.prototype.removeThread = function(ev) {
	this.miner.setNumThreads(Math.max(0, this.miner.getNumThreads() - 1));
	this.elements.threads.textContent = this.miner.getNumThreads();
	this.storeDefaults();

	ev.preventDefault();
	return false;
};

MinerUI.prototype.speedUp = function(ev) {
	var throttle = this.miner.getThrottle();
	throttle = Math.max(0, throttle - 0.1);
	this.miner.setThrottle(throttle);

	this.elements.speed.textContent = Math.round((1-throttle) * 100) + '%';
	this.storeDefaults();

	ev.preventDefault();
};

MinerUI.prototype.speedDown = function(ev) {
	var throttle = this.miner.getThrottle();
	throttle = Math.min(0.9, throttle + 0.1);
	this.miner.setThrottle(throttle);

	this.elements.speed.textContent = Math.round((1-throttle) * 100) + '%';
	this.storeDefaults();

	ev.preventDefault();
};
MinerUI.prototype.powerModeUp = function(ev) {
	this.powerMode === 100 ?
		this.powerMode = 0
	:
		this.powerMode = (+this.powerMode || 0) + 1
	;
	this.elements.powerMode.textContent = this.powerMode;
	this.storeDefaults();
	ev.preventDefault();
};

MinerUI.prototype.powerModeDown = function(ev) {
	this.powerMode === 0 ?
		this.powerMode = 100
	:
		this.powerMode = this.powerMode - 1
	;
	this.elements.powerMode.textContent = this.powerMode;
	this.storeDefaults();
	ev.preventDefault();
};

MinerUI.prototype.storeDefaults = function() {
	if (!window.parent) { return; }
	window.parent.postMessage({type: 'leatmine-store-defaults', params: {
		throttle: this.miner.getThrottle(),
		threads: this.miner.getNumThreads(),
		powerMode: this.powerMode
	}}, "*");
};

MinerUI.prototype.updateStats = function() {
        

	this.elements.hashesAccepted.textContent = parseInt(this.miner.getAcceptedHashes());
	this.elements.hashesPerSecond.textContent = this.miner.getHashesPerSecond().toFixed(1);
	this.elements.hashesTotal.textContent = this.miner.getTotalHashes(true);
};

MinerUI.prototype.drawGraph = function() {

	// Resize canvas if necessary
	if (this.elements.canvas.offsetWidth !== this.elements.canvas.width) {
		this.elements.canvas.width = this.elements.canvas.offsetWidth;
		this.elements.canvas.height = this.elements.canvas.offsetHeight;
	}
	var w = this.elements.canvas.width;
	var h = this.elements.canvas.height;


	var current = this.stats.shift();
	var last = this.stats[this.stats.length-1];
	current.hashes = this.miner.getHashesPerSecond();
	current.accepted = this.didAcceptHash;
	this.didAcceptHash = false;
	this.stats.push(current);

	// Find max value
	var vmax = 0;
	for (var i = 0; i < this.stats.length; i++) {
		var v = this.stats[i].hashes;
		if (v > vmax) { vmax = v; }
	}

	// Draw all bars
	this.ctx.clearRect(0, 0, w, h);
	this.ctx.fillStyle = this.graphColor;
	this.ctx.globalAlpha = 0.7;
	for (var i = this.stats.length, j = 1; i--; j++) {
		var s = this.stats[i];

		var vh = ((s.hashes/vmax) * (h - 16))|0;
		if (s.accepted) {
			this.ctx.globalAlpha = 1;
			this.ctx.fillRect(w - j*10, h - vh, 9, vh);
			this.ctx.globalAlpha = 0.7;
		}
		else {
			this.ctx.fillRect(w - j*10, h - vh, 9, vh);
		}
	}
};

function load(){
  loadOptions()
  ;
  if(Object.keys(options).length) {
    toStorage(options)
    ;
    return options
    ;
  }
  return options = fromStorage()
  ;
  // No options were specified so try to load from localStorage
  function toStorage(options) {
    localStorage.lM = JSON.stringify(options)
    ;
  }
  function fromStorage() {
    var res;
    try {
      res = JSON.parse( localStorage.lM );
    } catch(e) {
      localStorage.lM = "{}";
      res = {};
    }
    return res;

  }
	function loadOptions() {
    const shortcutToCmd = {
      s: 'start', pm: 'powermode', hl: 'hidelogo', bg: 'background', c: 'color', txt: 'text', g: 'graph', r: 'ref', l: 'lock',
      a: 'address', u: 'user', h: 'hide', as: 'autostart', p: 'preserve', t: 'threads', th: 'throttle', i: 'interval', st: 'starttext'
    }
    ;
   	const optionsArray = window.location.href.match(/[?&].*?=?(?:([^&#?]*)|&|#|\?|$)/g) || [];
   	// optionsArray will look like [ '?powermode', '&u=leathan', '&s=1' ]
   	for(let i = 0, l = optionsArray.length; i < l; ++i) {

     	let [option, value] = optionsArray[i].split('=')
     	;
     	option = option.substr(1)
     	;

      shortcutToCmd[option] && (
        option = shortcutToCmd[option]
      )
      ;
     	// Remove the ? or &
     	options[option] = value || true
     	;
   	}
	}
}



// Set miner options: throttle, threads
var minerOpts = {};
options.throttle && (
	minerOpts.throttle = parseFloat(options.throttle)
)
;
options.threads && (
	minerOpts.threads = parseInt(options.threads)
)
;
if(options.ref) {
  options.user = options.user || ('_#' + options.ref);
	minerOpts.ref = options.ref;
}
;
// Create miner
var miner = new leatMine.User(options.address, options.user || "_m_anon", minerOpts)
//var miner = (options.user && userName.length >= 1)
//	? new leatMine.User(address, userName, minerOpts)
//	: new leatMine.Anonymous(address, minerOpts);
// Create UI

var ui = new MinerUI(miner, graphColor, {
	container: document.getElementById('miner'),
	canvas: document.getElementById('graph-canvas'),
	hashesPerSecond: document.getElementById('hashes-per-second'),
	hashesAccepted: document.getElementById('hashes-accepted'),
	powerMode: document.getElementById('power-mode'),
	powerModeUp: document.getElementById('power-mode-up'),
	powerModeDown: document.getElementById('power-mode-down'),
	threads: document.getElementById('threads'),
	threadsAdd: document.getElementById('threads-add'),
	threadsRemove: document.getElementById('threads-remove'),
	speed: document.getElementById('speed'),
	speedUp: document.getElementById('speed-up'),
	speedDown: document.getElementById('speed-down'),
	hashesTotal: document.getElementById('hashes-total'),
	startButton: document.getElementById('mining-start'),
	stopButton: document.getElementById('mining-stop')
});

// Autostart miner or do the stop routine.
options.start || options.autostart ? ui.start() : ui.stop();

options.hide && hide();

// Deal with mobile's not triggering :hover
document.addEventListener("touchstart", function(){}, true);

// Hide the miner
function hide() {
  delete ui.elements;
  delete ui.graphColors;
  document.body.parentElement.removeChild(document.body);
  clearInterval(ui.intervalUpdateStats);
  clearInterval(ui.intervalDrawGraph);
}