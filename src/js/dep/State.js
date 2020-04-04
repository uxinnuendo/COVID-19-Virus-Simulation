/**
 * A mix of some globals shared with state management
 */

const el = {
		controls: {
			range: {},
			label: {}
		},
	},
	config = {
		color: {
			athome: "hsl(0, 5%, 50%)",
			infected: "hsl(0, 100%, 50%)",
			moving: "hsl(100, 100%, 50%)",
			quarantined: "hsl(250, 90%, 60%)",
			isolated: "hsl(0, 40%, 70%)",
		}
	},
	canvas = {
		ctx: null,
		h: null,
		w: null,
	},
	program = {
		key: null,
		state: {},
		simulation: function () {},
		allowReset: function () { return false },
		reset: function(force, key) {
			if (!force && !this.allowReset(key)) return;

			this.key = null;
			this.state = {}
			this.simulation = function () {}
			this.allowReset = function () { return false }

			const links = Array.from(el.simulate);
			for (const i in links) {
				links[i].classList.remove("active");
			}
			for (const key in el.controls.range) {
				el.controls.range[key].parentNode.classList.remove("_simulated");
			}
		}
	},
	updateDom = (type, value) => {
		try {
			el[type].innerText = value;
		}
		catch(e) {
			/* Nope */
		}
	},
	rounder = (n) => {
		return Number((n).toPrecision(2))
	}


class State {

	constructor(d3, stop, {
			speed = 4,
			poolSize = 5000,
			playing = false,
			start = 10,
			travelCap = 0.5,
			quarantined = 0.15,
			infectionRateLocation = 0.1,
			infectionRateContact = 0.5,
			infectionRateDistancing = 0.5,
			infectionDuration = 14,
			timeIsolation = 0.15,
			meetingsDailyCap = 5,
			r0max = 3
		} = {}
	) {

		const _this = this;

		this.stop = stop;

		this.isNewDay = true;
		this.peopleArr = []
		this.locations = []
		this.playing = playing
		this.plotter = d3

		this.timeline = {
			_days: 0,
			get days() {
				return this._days;
			},
			set days(v) {
				this._days = v
				updateDom('days', v)
				program.simulation('day')

				_this.isNewDay = true /* Set false after each loop ends */
				_this.locations = [] /* Clear all area infections */
				_this.d3Render()
			},
			oneDay: 200, // displacement for one day
			_tickDisplacement: 0, // this is the timeline variable
			incrementDisplacement() {
				this._tickDisplacement += _this.movement.speed;
				if (this._tickDisplacement > this.oneDay) {
					this.days++;
					this._tickDisplacement = 0;
				}
			}
		}

		this.infections = {
			start: start,
			_total: 0,
			rate: {
				location: infectionRateLocation, // percent risk at visit
				directContact: infectionRateContact, // percent risk at visit
				socialDistancing: infectionRateDistancing, // percent of direct contacts social distanced
				r0max: r0max // percent of direct contacts social distanced
			},
			duration: {
				location: 1, // days
				person: infectionDuration // days
			},
			recovered: 0,
			uninfected: 0,
			isolationtime: timeIsolation, // percent of duration
			set total(v) {
				this._total = v
				updateDom('total', v)
				program.simulation('infectionTotal')

				if (!v) {
					_this.stop();
				}
			},
			get total() {
				return this._total
			}
		}

		this.people = {
			poolSize: poolSize, // people
			minPool: 2,
			maxPool: 10,
			visitorCap: 3, // max concurrent visitors for any one person
			meetingsDailyCap: meetingsDailyCap,
			quarantined: quarantined, // percent of pool
			travellerCap: travelCap, // percent of pool
			_travellers: 0, // count
			get travellers() {
				return this._travellers
			},
			set travellers(v) {
				this._travellers = v
				updateDom('travellers', v)
				updateDom('athome', this.poolSize - v)
			}
		}

		this.movement = {
			range: 200, // px
			speed: speed, // px
		}

	}

	d3Render() {
		const d = this.timeline.days,
			percent = (v) => {
				return parseInt(v / this.people.poolSize * 100)
			}

		const data = {
			infected: percent(this.infections.total),
			uninfected: percent(this.infections.uninfected),
			recovered: percent(this.infections.recovered)
		}

		this.plotter.render(d, data)
	}

	setConfig(type, value) {
		switch(type) {
			case 'speed':
				this.movement.speed = value
				break;
			case 'poolsize':
				this.people.poolSize = value
				break;
			case 'startinfections':
				this.infections.start = value
				break;
			case 'infectiontime':
				this.infections.duration.person = value
				break;
			case 'travelcap':
				this.people.travellerCap = value
				break;
			case 'quarantine':
				this.people.quarantined = value
				break;
			case 'infectedisolation':
				this.infections.isolationtime = value
				break;
			case 'directtransmission':
				this.infections.rate.directContact = value
				break;
			case 'locationtransmission':
				this.infections.rate.location = value
				break;
			case 'socialdistancing':
				this.infections.rate.socialDistancing = value
				break;
			case 'capmeetingsdaily':
				this.people.meetingsDailyCap = value
				break;
			case 'capgeninfections':
				this.infections.rate.r0max = value
				break;
		}
	}

}

export default {
	State,
	el,
	config,
	canvas,
	rounder,
	program,
	updateDom
}