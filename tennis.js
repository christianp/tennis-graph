var points_to_win;
var tiebreak_points_to_win;
var games_to_win;
var sets_to_win;
var last_set_tiebreak;
var zoom;

var point_width;
var game_width;
var set_width;
var point_height;
var game_height;
var set_height;

var point_names = '0 15 30 40 A'.split(' ');

function add(won,lost) {
	var sa = won[0], ga = won[1], pa = won[2];
	var sb = lost[0], gb = lost[1], pb = lost[2];

	if(ga==gb && gb==games_to_win && (last_set_tiebreak || (sa<sets_to_win-1 || sb<sets_to_win-1))) {	// tiebreak
		if(pa >= tiebreak_points_to_win-1 && pa>pb) {
			return [[sa+1,0,0],[sb,0,0]];
		} else if(pa==tiebreak_points_to_win-1) {
			if(pb==tiebreak_points_to_win) {
				return [[sa,ga,tiebreak_points_to_win-1],[sb,gb,tiebreak_points_to_win-1]];
			} else {
				return [[sa,ga,tiebreak_points_to_win],[sb,gb,pb]];
			}
		} else {
			return [[sa,ga,pa+1],[sb,gb,pb]];
		}
	}

	if(pa>=points_to_win-1 && pa>pb) {
		// won game
		if(ga>=games_to_win-1 && ga>gb) {
			// won set
			return [[sa+1,0,0],[sb,0,0]];
		} else if(!last_set_tiebreak && (sa==sb && sb==sets_to_win-1 && gb==games_to_win+1)) {	// fifth set goes on until one player is ahead by two games
			return [[sa,games_to_win,0],[sb,games_to_win,0]];
		} else {
			return [[sa,ga+1,0],[sb,gb,0]];
		}
	} else if(pa==points_to_win-1) {
		if(pb==points_to_win) {
			return [[sa,ga,points_to_win-1],[sb,gb,points_to_win-1]];
		} else {
			return [[sa,ga,points_to_win],[sb,gb,pb]];
		}
	} else {
		return [[sa,ga,pa+1],[sb,gb,pb]];
	}
}

function match(callback) {
	var seen_states = []
	function see(state) {
		var s = JSON.stringify(state);
		seen_states[s] = true;
		return;
	}
	function seen(state) {
		var s = JSON.stringify(state);
		return seen_states[s] !== undefined;
	}

	var queue = [[[0,0,0],[0,0,0]]];
	while(queue.length) {
		var state = queue.shift();
		if(seen(state)) {
			continue;
			console.log("OI");
		}
		see(state);

		var sa = state[0][0], ga = state[0][1], pa = state[0][2],
			sb = state[1][0], gb = state[1][0], pb = state[1][2];

		callback(state);
		
		if(!(sa==sets_to_win || sb==sets_to_win)) {
			queue.push(add(state[0],state[1]));
			var b_wins = add(state[1],state[0]);
			queue.push([b_wins[1],b_wins[0]]);
		}
	}
}

function position(state) {
	var sa = state[0][0], ga = state[0][1], pa = state[0][2],
		sb = state[1][0], gb = state[1][1], pb = state[1][2];

	if(sa==sets_to_win) {
		return [-(sets_to_win)*set_width,(2*sets_to_win-0.9)*set_height];
	} else if(sb==sets_to_win) {
		return [(sets_to_win)*set_width,(2*sets_to_win-0.9)*set_height];
	}

    var x = (pb-pa)*point_width + (gb-ga)*game_width + (sb-sa)*set_width;
    var y = (pb+pa)*point_height + (gb+ga)*game_height + (sb+sa)*set_height;
	return [x,y];
}

function show_score(state) {
	var sa = state[0][0], ga = state[0][1], pa = state[0][2],
		sb = state[1][0], gb = state[1][1], pb = state[1][2];
	if(sa==sets_to_win) {
		return [[sa,0,0],[0,0,0]];
	} else if(sb==sets_to_win) {
		return [[0,0,0],[sb,0,0]];
	} else if(ga==gb && ga==games_to_win && (last_set_tiebreak || (sa<sets_to_win && sb<sets_to_win))) {
		return [[sa,ga,pa],[sb,gb,pb]];
	} else {
		return [[sa,ga,point_names[pa]],[sb,gb,point_names[pb]]];
	}
}

function draw_tennis() {
	//var canvas = document.getElementById('tennis');
	var width = 1600;

	var px = 2*(point_width+set_width*sets_to_win);
	var py = 2*point_width+set_height*(sets_to_win*2-0.5);
	var ratio = 1;

	var svg = document.getElementById('svg');
	svg.innerHTML = '';
	svg.setAttribute('width',zoom*px);
	svg.setAttribute('height',zoom*py*ratio);
	svg.setAttribute('viewBox',[-px/2,-point_height,px,py].join(' '));
	var xmlns = "http://www.w3.org/2000/svg";

	function makeElement(name,attr,content) {
		var e = document.createElementNS(xmlns,name);
		for(var key in attr) {
			e.setAttribute(key,attr[key]);
		}
		if(content!==undefined) {
			e.innerHTML = content;
		}
		return e;
	}

	var lines = makeElement('g',{'class':'lines'});
	svg.appendChild(lines);
	var dots = makeElement('g',{'class': 'dots'});
	svg.appendChild(dots);

	match(function(state) {
		var pos = position(state);
		g = makeElement('g',{
			transform: 'translate('+pos[0]+' '+pos[1]+')',
			'class': 'score'
		});
		dots.appendChild(g);

		var c = makeElement('circle',{
			cx:0,
			cy:0,
			r:point_width*0.5,
			"class": 'score',
			'data-state':JSON.stringify(state)
		});
		if(state[0][0]==sets_to_win) {
			c.classList.add('win','a');
		}
		g.appendChild(c);
		function make_scoreboard(state) {
			return function(){ show_scoreboard(state) };
		}
		g.onmouseover = make_scoreboard(state);
		g.onmouseout = hide_scoreboard;
		/*
		var text = makeElement('text',{
			x:0,y:0,
			'font-size': 0.3*point_width
		});
		text.appendChild(makeElement('tspan',{x:0,dy:'0.5em'},point_names[state[0][2]]+'-'+point_names[state[1][2]]));
		g.appendChild(text);
		*/

		var state_a = add(state[0],state[1]);
		var pa = position(state_a);
		var la = makeElement('line',{
			x1: pos[0],
			y1: pos[1],
			x2: pa[0],
			y2: pa[1],
			"class": 'point a'
		});
		lines.appendChild(la);

		var state_b = add(state[1],state[0]);
		var pb = position([state_b[1],state_b[0]]);
		var lb = makeElement('line',{
			x1: pos[0],
			y1: pos[1],
			x2: pb[0],
			y2: pb[1],
			"class": 'point b'
		});
		lines.appendChild(lb);
	});

	window.scrollTo((svg.clientWidth-window.innerWidth)/2,0);
}

function show_scoreboard(state) {
	var table = document.getElementById('scoreboard');
	table.classList.add('show');
	var score = show_score(state);
	var rows = table.querySelectorAll('tbody tr');
	for(var i=0;i<2;i++) {
		var cells = rows[i].querySelectorAll('td');
		for(var j=0;j<state[i].length;j++) {
			cells[j+1].innerText = score[i][j];
		}
	}
}

function hide_scoreboard() {
	var table = document.getElementById('scoreboard');
	table.classList.remove('show');
}

function update() {
	function get_value(id) {
		console.log(id);
		return parseFloat(document.getElementById(id).value);
	}

	points_to_win = get_value('points_to_win');
	games_to_win = get_value('games_to_win');
	sets_to_win = get_value('sets_to_win');
	tiebreak_points_to_win = get_value('tiebreak_points_to_win');
	last_set_tiebreak = document.getElementById('last_set_tiebreak').checked;

	zoom = get_value('zoom');

	point_width = 30;
	game_width = points_to_win*2*point_width;
	set_width = games_to_win*2*game_width;
	point_height = point_width;
	game_height = points_to_win*2*point_height*1.1;
	set_height = (games_to_win*2*game_height + tiebreak_points_to_win*2*point_height)*1.1;

	draw_tennis();
}

var controls = document.querySelectorAll('#controls input');
for(var i=0;i<controls.length;i++) {
	controls[i].onchange = update;
}

update();
setTimeout(function(){
scrollTo((document.getElementById('svg').clientWidth-window.innerHeight)/2,0);
},100);
