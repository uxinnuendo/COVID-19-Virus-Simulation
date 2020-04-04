/**
 * Our simulated dots
 */

class Person{

	constructor({x, y}, infected, quarantine, {
		canvas, color, state
	}) {
		this.x = x;
		this.y = y;

		this.home = { x, y }
		this.dest = { x: null, y: null }

		this.color = color;
		this.canvas = canvas;
		this.appState = state;

		this.r = infected ? 2 : 1
		this.quarantined = !!quarantine;
		this.stay = false;
		this.visits = 0;
		this.visitors = 0;
		this.contactPool = []

		this._travelling = false;
		this.visitingIdx = null;

		this.dayInfected = null
		this.infected = !!infected;
		this.infectedIsolation = false;

		this.previouslyInfected = false;
		this.allowReinfection = false;
		this.recovered = false;
	}

	set travelling(bool) {
		if (bool && this._travelling ||
			!bool && !this._travelling) return;

		this._travelling = bool
		this.appState.people.travellers += bool ? 1 : -1;
	}

	get travelling() {
		return this._travelling
	}

	set infected(bool) {
		if (bool && this._infected ||
			!bool && !this._infected) return;

		if (bool && this.previouslyInfected && !this.allowReinfection) {
			return;
		}

		this.r = bool ? 2 : 1;
		this._infected = bool

		if (bool) {
			this.appState.infections.total++
			this.previouslyInfected = true;
			this.dayInfected = this.appState.timeline.days || 1
		}
		else {
			this.appState.infections.total--
			this.recovered = true;
			this.dayInfected = null
		}
	}

	get infected() {
		return this._infected
	}

	checkInfection() {
		if (this.dayInfected &&
			(this.appState.timeline.days - this.dayInfected) >= this.appState.infections.duration.person
		) {
			this.infected = false;
		}
	}

	canTravel() {
		const homeRiddenDuration = this.appState.infections.duration.person * this.appState.infections.isolationtime

		const isolationBegin = this.dayInfected + (this.appState.infections.duration.person - homeRiddenDuration),
			isolationEnd = this.dayInfected + this.appState.infections.duration.person

		const withinIsolationPeriod = this.infected && isolationBegin <= this.appState.timeline.days && isolationEnd >= this.appState.timeline.days

		this.infectedIsolation = !!withinIsolationPeriod;

		return !withinIsolationPeriod && !this.stay && !this.travelling && !this.quarantined
	}

	setDestination({x, y}, idx) {
		this.travelling = true
		this.visitingIdx = idx
		this.dest = {
			x, y
		}
	}

	goHome() {
		this.visitingIdx = null
		this.dest = {
			x: this.home.x,
			y: this.home.y
		}
	}

	clearTravel() {
		this.dest = {
			x: null, y: null
		}
	}

	getChance(decimalPercent) {
		return Math.random() <= decimalPercent
	}

	getLocation() {
		return {x: this.x, y: this.y}
	}

	withinRange(v, target) {
		if (v >= target - this.appState.movement.speed &&
			v <= target + this.appState.movement.speed) {
			return true;
		}
		return false
	}

	move() {
		const moveTo = {
			x: this.dest.x || this.home.x,
			y: this.dest.y || this.home.y,
		}

		const withinRangeX = this.withinRange(this.x, moveTo.x),
			withinRangeY = this.withinRange(this.y, moveTo.y);

		let adjustX = this.x < moveTo.x ? +this.appState.movement.speed :
					(this.x > moveTo.x ? -this.appState.movement.speed : 0),
			adjustY = this.y < moveTo.y ? +this.appState.movement.speed :
					(this.y > moveTo.y ? -this.appState.movement.speed : 0)

		if (withinRangeX) {
			this.x = moveTo.x;
			adjustX = 0;
		}
		if (withinRangeY) {
			this.y = moveTo.y;
			adjustY = 0;
		}

		if (!withinRangeX) { this.x += adjustX; }
		if (!withinRangeY) { this.y += adjustY; }

		if (
			!adjustX && !adjustY
		) {

			const destX = parseInt(this.dest.x * 10) / 10,
				destY = parseInt(this.dest.y * 10) / 10;

			if (destX && destX == this.x &&
				destY && destY == this.y &&
				this.home.x != this.x &&
				this.home.y != this.y
			) {

				const visiting = this.appState.peopleArr.find(e => e.home.x == destX && e.home.y == destY)

				if (visiting.visitors > 0) {
					visiting.visitors--;

					if (!visiting.visitors) this.stay = false;
				}

				this.calculateLocationInfections()

				this.visits++;
				this.goHome()

			}

			else if (
				destX &&
					this.home.x == this.x &&
					this.home.y == this.y
			) {

				this.travelling = false
				this.clearTravel()
			}
		}

	}

	calculateLocationInfections() {
		const locationKey = `${this.x}:${this.y}`;

		if (this.infected) {

			/* Infect Area */
			if (!this.appState.locations.hasOwnProperty(locationKey)) {
				this.appState.locations[locationKey] = this.appState.infections.rate.location
			}

			/* Infect person visited */
			if (this.visitingIdx && !this.appState.peopleArr[this.visitingIdx].infected) {
				const infectionChance = this.getChance(this.appState.infections.rate.directContact),
					socialDistanced = this.getChance(this.appState.infections.rate.socialDistancing)
				if (infectionChance && !socialDistanced) {
					this.appState.peopleArr[this.visitingIdx].infected = true;
				}
			}

		}

		else {

			/* Get infection from area */
			if (this.appState.locations[locationKey]) {
				const infectionChance = this.getChance(this.appState.locations[locationKey])
				if (infectionChance) {
					this.infected = true;
				}
			}

			/* Get infection from person visited */
			if (this.visitingIdx && this.appState.peopleArr[this.visitingIdx].infected) {
				const infectionChance = this.getChance(this.appState.infections.rate.directContact),
					socialDistanced = this.getChance(this.appState.infections.rate.socialDistancing)
				if (infectionChance && !socialDistanced) {
					this.infected = true;
				}
			}

		}

	}

	draw() {
		this.canvas.ctx.beginPath();

		this.canvas.ctx.fillStyle = this.infected ? (
			this.infectedIsolation ? this.color.isolated : this.color.infected) :
			(this.quarantined ? this.color.quarantined :
				(this.travelling ? this.color.moving : this.color.athome));

		this.canvas.ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
		this.canvas.ctx.fill();
		this.canvas.ctx.closePath();
	}
}


export default Person