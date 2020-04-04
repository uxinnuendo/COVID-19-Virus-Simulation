import rangeSlider from 'rangeslider-js'
import D3Plot from './dep/D3plot'
import Person from './dep/Person'
import * as state from './dep/State'

const _ = window._ = state.default
let appState

/**
 * Programs that change simulation variables accordingly
 */

function setSimulationProgram(ev, key) {

	const programKey = ev?.target?.dataset?.simProgram || key,
		link = ev?.target || document.querySelector(`[data-sim-program='${key}']`)

	if (_.program.key === programKey) {
		return _.program.reset(true)
	}

	if (!appState.playing) {
		reset();
	}

	_.program.key = programKey

	const links = Array.from(_.el.simulate);
	for (const i in links) {
		links[i].classList.remove("active");
	}

	link.classList.add("active")

	switch(programKey) {

		/* Ebb & Flow */
		case 'a':
			_.program.allowReset = function (key) {
				return ["travelcap","socialdistancing"].includes(key)
			}
			_.program.simulation = function (field) {
				const _update = (targetT, targetD, phase) => {

					_.program.state.adjustmentPhase = phase

					const sT = appState.people.travellerCap,
						sD = appState.infections.rate.socialDistancing

					const adjustT = sT === targetT ? 0 : (
							targetT < sT ? -0.05 : +0.05),
						adjustD = sD === targetD ? 0 : (
							targetD < sD ? -0.05 : +0.05)

					if (!adjustT && !adjustD) {
						return _.program.state.adjustmentPhase = null
					}

					const newT = _.rounder(sT + adjustT),
						newD = _.rounder(sD + adjustD)

					appState.people.travellerCap = newT
					appState.infections.rate.socialDistancing = newD
					_.el.controls.label.travelcap.innerText = (_.rounder(newT * 100)) + '%'
					_.el.controls.label.socialdistancing.innerText = (_.rounder(newD * 100)) + '%'
					_.el.controls.range.travelcap['rangeslider-js'].update({value:newT})
					_.el.controls.range.socialdistancing['rangeslider-js'].update({value:newD})
					_.el.controls.range.travelcap.parentNode.classList.add("_simulated")
					_.el.controls.range.socialdistancing.parentNode.classList.add("_simulated")
				}

				const t = appState.infections.total,
					p = appState.people.poolSize,
					tr = appState.people.travellerCap,
					d = appState.infections.rate.socialDistancing;

				switch(field) {
					case 'infectionTotal':
						if (_.program.state.startPhaseComplete && (
							t < 40 || _.program.state.adjustmentPhase === "p2-up")
						) {
							_.program.state.finalPhase = true

							const targetT = 1, targetD = 0
							_update(targetT, targetD, "p2-up")
						}
						else if (t < parseInt(p / 25) && !_.program.state.finalPhase || _.program.state.adjustmentPhase === "up"
						) {

							const targetT = 0.8, targetD = 0.4
							_update(targetT, targetD, "up")
						}
						else if (t > parseInt(p / 18) && _.program.state.finalPhase || _.program.state.adjustmentPhase === "p2-down"
						) {

							const targetT = 0.4, targetD = 0.1
							_update(targetT, targetD, "p2-down")

						}
						else if (t > parseInt(p / 10) || _.program.state.adjustmentPhase === "down"
						) {
							_.program.state.startPhaseComplete = true;

							const targetT = 0.1, targetD = 0.9
							_update(targetT, targetD, "down")

						}
						break;

				}
			}
			break;

	}

}

/**
 * Initialisations - run once
 */

function initStats() {

	_.el.uninfected = document.querySelector("[data-uninfected]")
	_.el.recovered = document.querySelector("[data-recover]")
	_.el.total = document.querySelector("[data-infected]")
	_.el.isolated = document.querySelector("[data-isolated]")
	_.el.travellers = document.querySelector("[data-travellers]")
	_.el.athome = document.querySelector("[data-athome]")
	_.el.quarantined = document.querySelector("[data-quarantined]")
	_.el.stay = document.querySelector("[data-stay]")
	_.el.days = document.querySelector("[data-days]")

	_.updateDom('total', appState.infections.total)
	_.updateDom('days', appState.timeline.days)

}

function initSimulations() {

	_.el.simulate = document.querySelectorAll("[data-simulation]")
	const links = Array.from(_.el.simulate);
	for (const i in links) {
		links[i].addEventListener("click", setSimulationProgram)
	}

}

function initControls() {

	_.el.controls.range.speed = document.querySelector('[data-range-speed')
	_.el.controls.range.poolsize = document.querySelector('[data-range-poolsize')
	_.el.controls.range.startinfections = document.querySelector('[data-range-startinfections')
	_.el.controls.range.travelcap = document.querySelector('[data-range-travelcap')
	_.el.controls.range.quarantine = document.querySelector('[data-range-quarantine')
	_.el.controls.range.infectiontime = document.querySelector('[data-range-infectiontime')
	_.el.controls.range.infectedisolation = document.querySelector('[data-range-infectedisolation')
	_.el.controls.range.directtransmission = document.querySelector('[data-range-directtransmission')
	_.el.controls.range.locationtransmission = document.querySelector('[data-range-locationtransmission')
	_.el.controls.range.socialdistancing = document.querySelector('[data-range-socialdistancing')
	_.el.controls.range.capgeninfections = document.querySelector('[data-range-capgeninfections')
	_.el.controls.range.capmeetingsdaily = document.querySelector('[data-range-capmeetingsdaily')

	_.el.controls.label.speed = document.querySelector('[data-value-speed')
	_.el.controls.label.poolsize = document.querySelector('[data-value-poolsize')
	_.el.controls.label.startinfections = document.querySelector('[data-value-startinfections')
	_.el.controls.label.travelcap = document.querySelector('[data-value-travelcap')
	_.el.controls.label.quarantine = document.querySelector('[data-value-quarantine')
	_.el.controls.label.infectiontime = document.querySelector('[data-value-infectiontime')
	_.el.controls.label.infectedisolation = document.querySelector('[data-value-infectedisolation')
	_.el.controls.label.directtransmission = document.querySelector('[data-value-directtransmission')
	_.el.controls.label.locationtransmission = document.querySelector('[data-value-locationtransmission')
	_.el.controls.label.socialdistancing = document.querySelector('[data-value-socialdistancing')
	_.el.controls.label.capgeninfections = document.querySelector('[data-value-capgeninfections')
	_.el.controls.label.capmeetingsdaily = document.querySelector('[data-value-capmeetingsdaily')

	const rangeInputs = {
		'speed': {
			value: appState.movement.speed,
			min: 1,
			max: 200,
			step: 2,
		},
		'poolsize': {
			value: appState.people.poolSize,
			min: 1000,
			max: 20000,
			step: 1000,
		},
		'startinfections': {
			value: appState.infections.start,
			min: 1,
			max: 1000,
			step: 2,
		},
		'infectiontime': {
			value: appState.infections.duration.person,
			min: 1,
			max: 30,
			step: 1,
		},
		'travelcap': {
			value: appState.people.travellerCap,
		},
		'quarantine': {
			value: appState.people.quarantined,
		},
		'infectedisolation': {
			value: appState.infections.isolationtime,
		},
		'directtransmission': {
			value: appState.infections.rate.directContact,
		},
		'locationtransmission': {
			value: appState.infections.rate.location,
		},
		'socialdistancing': {
			value: appState.infections.rate.socialDistancing,
		},
		'capmeetingsdaily': {
			value: appState.people.meetingsDailyCap,
			min: 0,
			max: 10,
			step: 1,
		},
		'capgeninfections': {
			value: appState.infections.rate.r0max,
			min: 0,
			max: 10,
			step: 1,
		}
	}

	for (const rangeKey in rangeInputs) {
		const rangeOptions = rangeInputs[rangeKey];
		const options = {
			min: rangeOptions.min || 0, max: rangeOptions.max || 1, step: rangeOptions.step || 0.05,
			value: rangeOptions.value,
			onSlideStart: () => {
				_.program.reset(null, rangeKey)
			},
			onSlide: (value, percent, position) => update(rangeKey, value, !rangeOptions.max),
		}

		updateLabelValue(rangeKey, rangeOptions.value, !rangeOptions.max)
		rangeSlider.create(_.el.controls.range[rangeKey], options)

	}

	function update(type, value, isPercentage) {

		updateLabelValue(type, value, isPercentage)
		appState.setConfig(type, value)

		switch (type) {
			case 'poolsize':
				if (value < appState.infections.start) {
					update('startinfections', value)
				}
				restart();
				break;

			case 'startinfections':
			case 'quarantine':
				restart();
				break;
		}
	}

	let restartTicker = null;
	function restart() {
		console.log("Restarting..");
		clearTimeout(restartTicker)
		restartTicker = setTimeout(reset, 500)
	}

	function updateLabelValue(type, value, isPercentage) {
		try {
			_.el.controls.label[type].innerText = isPercentage ? _.rounder(value * 100) + '%' : value
		}
		catch(e) {
			/* Nope */
		}
	}

	_.el.controls.startstop = document.getElementById('startstop');
	_.el.controls.startstop.addEventListener("click", () => {
  	if (appState.playing) {
  		stop()
  	}
  	else {
  		start()
  	}
  })

	_.el.controls.reset = document.getElementById('reset');
	_.el.controls.reset.addEventListener("click", () => {
		reset();
	})

}

/**
 * Initialisations - run many
 */

function initPeople() {

	let quarantineCount = 0,
		startingInfections = appState.infections.start;

	for(let i=0; i<appState.people.poolSize; i++){

		const homeXY = {
			x: Math.floor(Math.random() * Math.floor(_.canvas.w)),
			y: Math.floor(Math.random() * Math.floor(_.canvas.h))
		}
		const infection = startingInfections ? startingInfections-- : 0
		const quarantine = !infection && quarantineCount < (appState.people.poolSize * appState.people.quarantined)
		if (quarantine) quarantineCount++

		const person = new Person(homeXY, infection, quarantine,
			{
				canvas: _.canvas,
				color: _.config.color,
				state: appState
			});

	  appState.peopleArr.push(person);
	}

	_.el.quarantined.innerText = quarantineCount

	for (const i in appState.peopleArr) {
		const p = appState.peopleArr[i]

		const maxContactPool = Math.floor(Math.random() * Math.floor(appState.people.maxPool) + appState.people.minPool)

		const localPeopleIdxs = appState.peopleArr.reduce((acc, e, idx) => {
			if (e.x > p.x - (appState.movement.range/2) &&
				e.x < p.x + (appState.movement.range/2) &&
				e.y > p.y - (appState.movement.range/2) &&
				e.y < p.y + (appState.movement.range/2) &&
					!p.quarantined) {
				acc.push(idx)
			}
			return acc;
		}, [])

		const randomIndex = (arr) => {
			const index = Math.floor(Math.random() * Math.floor(arr.length-1))
			const value = arr[index];
			arr.splice(index, 1)
			return value;
		}

		for (let f = 0; f < maxContactPool; f++) {
			try {
				p.contactPool.push(randomIndex(localPeopleIdxs))
			}
			catch(e) {
				/* oh well */
			}
		}
	}

}

function initState() {
	const chartPlotter = new D3Plot(_.el.chart, 200);
	const presets = !appState ? {} :
		{
			speed: appState.movement.speed,
			poolSize: appState.people.poolSize,
			playing: appState.playing,
			start: appState.infections.start,
			travelCap: appState.people.travellerCap,
			quarantined: appState.people.quarantined,
			infectionRateLocation: appState.infections.rate.location,
			infectionRateContact: appState.infections.rate.directContact,
			infectionRateDistancing: appState.infections.rate.socialDistancing,
			infectionDuration: appState.infections.duration.person,
			timeIsolation: appState.infections.isolationtime,
			meetingsDailyCap: appState.people.meetingsDailyCap,
			r0max: appState.infections.rate.r0max
		}

	appState = window._appState = new _.State(chartPlotter, presets)
	appState.d3Render()

}


/**
 * Canvas setup - run once
 */

function canvasSetup() {
	document.body.classList.add("_on")

	_.el.chart = document.getElementById("d3-chart")
	initState();

	initStats();
	initControls();
	initSimulations();

	const banner = document.querySelector("[data-component-banner]")
	banner.style.background = "black";
	banner.style.maxHeight = "100vh";
	banner.style.maxWidth = "100vw";

	const canvas = document.getElementById("canvas");
	canvas.style.maxHeight = "100vh";
	canvas.style.maxWidth = "100vw";

	_.canvas.ctx = canvas.getContext("2d", { alpha: false });
	_.canvas.h = _.canvas.ctx.canvas.height = document.querySelector(".banner").offsetHeight*2
	_.canvas.w = _.canvas.ctx.canvas.width = document.querySelector(".banner").offsetWidth*2

	const body = document.querySelector("body")
	let controlsOut = false;
	canvas.addEventListener("click", () => {
		controlsOut = !controlsOut
		const action = controlsOut ? "add" : "remove"
		body.classList[action]("_controls-out")
	})

	window.onresize = windowResized;

	let resizeTick = null;
	function windowResized() {
		if ((_.canvas.h/2) < 768) return;

		clearInterval(resizeTick)
		resizeTick = setTimeout(location.reload, 100)
	}

	initPeople()

	setSimulationProgram(null, "a");
}


/**
 * Looping control
 */

function reset() {
	console.info("Reset");

	if (!appState.playing) {
		_.program.reset(true);
	}

	_.canvas.ctx.fillStyle = "black";
	_.canvas.ctx.fillRect(0, 0, _.canvas.w, _.canvas.h);

	stop();
	initState();
	initPeople();
	start();
}

function stop() {
	console.info("Stopped");

	appState.playing = false;
	_.el.controls.startstop.innerText = "Start"
}

function start() {
	console.info("Started");

	appState.playing = true;
	_.el.controls.startstop.innerText = "Stop"
	requestAnimationFrame(loop);
}

function loop() {

	if (!appState.playing) return;

	appState.timeline.incrementDisplacement()

	_.canvas.ctx.fillStyle = "black";
	_.canvas.ctx.fillRect(0, 0, _.canvas.w, _.canvas.h);

	let acceptingVisitors = 0,
		isolatedCount = 0,
		recoveries = 0;

	let test = 0;
  for (const idx in appState.peopleArr) {
  	const p = appState.peopleArr[idx]
  	const travellerPercent = appState.people.travellers / appState.people.poolSize

  	if (appState.isNewDay) {
  		p.visitsDaily = 0;
  	}

  	if (p.infected) {
  		p.checkInfection();
  	}

  	if (p.canTravel() && travellerPercent < appState.people.travellerCap) {

	  	const personIdx = Math.floor(Math.random() * Math.floor(p.contactPool.length)),
	  		travelToIdx = p.contactPool[personIdx],
	  		visitPerson = appState.peopleArr[travelToIdx];

	  	if (travelToIdx != idx &&
	  		!visitPerson.quarantined &&
	  		!visitPerson.travelling &&
	  		visitPerson.visitors < appState.people.visitorCap
	  	) {

	  		visitPerson.visitors++
		  	visitPerson.stay = true
		  	p.setDestination(visitPerson.home, travelToIdx)
	  	}
  	}

  	acceptingVisitors += p.stay
		isolatedCount += p.infectedIsolation
		recoveries += p.recovered

  	if (p.travelling) {
	    p.move();
  	}

    p.draw();

  }

  _.el.stay.innerText = acceptingVisitors
  _.el.isolated.innerText = isolatedCount

  appState.infections.recovered = recoveries
  _.el.recovered.innerText = recoveries

  const uninfected = appState.peopleArr.length - appState.infections.total - recoveries
  appState.infections.uninfected = uninfected
  _.el.uninfected.innerText = uninfected

  appState.isNewDay = false;

  requestAnimationFrame(loop);
}

export const corona = {
	run() {
		canvasSetup();
		start();
	},
};
