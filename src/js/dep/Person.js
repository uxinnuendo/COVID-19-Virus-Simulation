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
		this.visitsDaily = 0; /* Total contacts, cleared daily */

		this.visitingIdx = null; /* Traveling to  */
		this.visitorIdxs = []; /* People visiting */

		this.contactPool = []; /* People for interaction */

		this.dayInfected = null
		this.infected = !!infected;
		this.infectedIsolation = false;
		this.infectionsCount = 0; /* Infections transferred to others */

		this._travelling = false;
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

		const belowMaxVisitsThreshold = this.visitsDaily < this.appState.people.meetingsDailyCap

		this.infectedIsolation = !!withinIsolationPeriod;

		return belowMaxVisitsThreshold && !withinIsolationPeriod && !this.stay && !this.travelling && !this.quarantined
	}

	setDestination({x, y}, destinationIdx, visitorIdx) {
		this.travelling = true
		this.visitingIdx = destinationIdx
		this.appState.peopleArr[this.visitingIdx].visitorIdxs.push(this.visitorIdx)

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

				const destinationPerson = this.appState.peopleArr[this.visitingIdx]

				const index = destinationPerson.visitorIdxs.findIndex(e => e === this.visitingIdx)
				destinationPerson.visitorIdxs.splice(index, 1)

				if (destinationPerson.visitorIdxs.length === 0) {
					destinationPerson.stay = false;
				}

				this.generateInfections()

				this.visits++;
				this.visitsDaily++;
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

	generateInfections() {
		const locationKey = `${this.x}:${this.y}`;

		if (this.infected) {

			/* Infect Area */
			if (!this.appState.locations.hasOwnProperty(locationKey)) {
				this.appState.locations[locationKey] = this.appState.infections.rate.location
			}

			/* Infect person visited */
			if (this.visitingIdx && !this.appState.peopleArr[this.visitingIdx].infected) {
				const infectionChance = this.getChance(this.appState.infections.rate.directContact),
					socialDistanced = this.getChance(this.appState.infections.rate.socialDistancing),
					belowR0max = this.infectionsCount < this.appState.infections.rate.r0max

				if (belowR0max && infectionChance && !socialDistanced) {
					this.appState.peopleArr[this.visitingIdx].infected = true;
					this.infectionsCount++;
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
					socialDistanced = this.getChance(this.appState.infections.rate.socialDistancing),
					belowR0max = this.appState.peopleArr[this.visitingIdx].infectionsCount < this.appState.infections.rate.r0max

				if (belowR0max && infectionChance && !socialDistanced) {
					this.infected = true;
					this.appState.peopleArr[this.visitingIdx].infectionsCount++;
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