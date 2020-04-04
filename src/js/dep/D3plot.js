/**
 * A small infection graph to show above the stats
 */

import { select, scaleOrdinal, scaleLinear, nest, stack, extent, area } from 'd3'

class D3Plot {

	constructor(svgNode, days) {

		this.days = days
		this.el = svgNode

		this.width = this.el.parentNode.offsetWidth
		this.height = this.el.parentNode.offsetHeight

		this.data = []

		this.svg = select(this.el)
		this.svg.attr("viewBox", [0, 0, this.width, this.height]);

		this.groupNames = ["Recovered", "Infected"]
		this.groupKeys = [1,2]

		this.color = scaleOrdinal()
			.domain(this.groupNames)
			.range(['rgba(228, 26, 28, 0.5)','rgba(26, 153, 228, 0.5)'])

	}

	render(d, {infected, uninfected, recovered}) {

		this.svg
			.selectAll("*")
			.remove();

		this.data.push({ day: d, name: "Infected", n: infected })
		// this.data.push({ day: d, name: "Uninfected", n: uninfected })
		this.data.push({ day: d, name: "Recovered", n: recovered })

		const sumstat = nest()
			.key(function(_d) { return _d.day;})
			.entries(this.data);

		const stackedData = stack()
			.keys(this.groupKeys)
			.value(function(_d, key){
				return _d.values[key-1].n
			})(sumstat)

		const x = scaleLinear()
			.domain( extent(this.data, function(_d) { return _d.day; }) )
			.range([ 0, this.width ]); // px scale

		const y = scaleLinear()
			.domain([ 0, 100 ]) // unit of measurement range
			.range([ this.height, 0 ]); // px scale

		const reverse = (v) => {
			return (1 - (Number(v) / this.height)) * this.height
		}

		const groupNames = this.groupNames,
			colors = this.color

		this.svg
			.selectAll("mylayers")
			.data(stackedData)
			.enter()
			.append("path")
				.style("fill", function (_d) {
					const name = groupNames[_d.key-1];
					return colors(name);
				})
				.attr("d", area()
					.x(function(_d, i) {
						return x(_d.data.key);
					})
					.y0(function(_d) {
						const yBottom = y(_d[0])
						return yBottom
					})
					.y1(function(_d) {
						const yTop = y(_d[1]);
						return yTop
					})
				)

	}

}

export default D3Plot