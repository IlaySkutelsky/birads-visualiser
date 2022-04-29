
function renderAreas(areas) {
	console.log(areas)
	let radius = 200
	let svgElm = document.querySelector("svg")
	svgElm.setAttributeNS(null, 'width', 400);
	svgElm.setAttributeNS(null, 'height', 400);
	let circleElm1 =  document.createElementNS('http://www.w3.org/2000/svg' ,'circle')
	circleElm1.setAttributeNS(null, 'cx', radius);
	circleElm1.setAttributeNS(null, 'cy', radius);
	circleElm1.setAttributeNS(null, 'r', radius);
	circleElm1.setAttributeNS(null, 'fill', '#1ba94b');
	circleElm1.setAttributeNS(null, 'stroke', 'white');
	let circleElm2 = circleElm1.cloneNode()
	circleElm2.setAttributeNS(null, 'fill', 'none');
	circleElm2.setAttributeNS(null, 'r', radius*2/3);
	let circleElm3 = circleElm2.cloneNode()
	circleElm3.setAttributeNS(null, 'r', radius/3);
	svgElm.append(circleElm1)
	for (let i=0; i<areas.length; i++) {
		let area = areas[i]
		let chunckElm = document.createElementNS("http://www.w3.org/2000/svg", "path")
		let d = pathFromObject(area, radius)
		chunckElm.setAttributeNS(null, "d", d);
		chunckElm.setAttributeNS(null, 'stroke', 'white');
		let patternFillUrl
		if (area.type == 'cyst') patternFillUrl = 'url(#dots-pattern)'
		else if (area.type == 'gush') patternFillUrl = 'url(#stripes-pattern)'
		else patternFillUrl = '#56a4da'
		chunckElm.setAttributeNS(null, 'fill', patternFillUrl);
		svgElm.append(chunckElm)
	}
	let d = ''
	for (let i=0; i<6; i++) {
		let a1 = (i+0.5)*(2*Math.PI/12)
		let a2 = (i+6.5)*(2*Math.PI/12)
		let r = (radius/10)
		let x1 = Math.round(Math.sin(a1)*r)*10+radius
		let y1 = Math.round(Math.cos(a1)*r)*10+radius
		let x2 = Math.round(Math.sin(a2)*r)*10+radius
		let y2 = Math.round(Math.cos(a2)*r)*10+radius
		d += `M ${x1} ${y1} L ${x2} ${y2} `
	}
	let slicesLinesElm = document.createElementNS("http://www.w3.org/2000/svg", "path")
	slicesLinesElm.setAttributeNS(null, "d", d);
	slicesLinesElm.setAttributeNS(null, 'stroke', 'white');
	svgElm.append(slicesLinesElm)
	svgElm.append(circleElm2)
	svgElm.append(circleElm3)
}

function pathFromObject(obj, radius) {
	let str = ''
	let a1 = (obj.fromHour-3.5)*(2*Math.PI/12)

	const cos = Math.cos;
	const sin = Math.sin;
	const π = Math.PI;
	let cx = radius
	let cy = radius
	let rx1 = radius*(obj.toLevel+1)/3
	let ry1 = radius*(obj.toLevel+1)/3
	let t1 = a1
  let φ = 0
	let Δ = (2*π/12)*(obj.toHour-obj.fromHour)
	const f_matrix_times = (( [[a,b], [c,d]], [x,y]) => [ a * x + b * y, c * x + d * y]);
	const f_rotate_matrix = (x => [[cos(x),-sin(x)], [sin(x), cos(x)]]);
	const f_vec_add = (([a1, a2], [b1, b2]) => [a1 + b1, a2 + b2]);
	const rotMatrix = f_rotate_matrix(φ);
	const [sX1, sY1] = ( f_vec_add ( f_matrix_times ( rotMatrix, [rx1 * cos(t1), ry1 * sin(t1)] ), [cx,cy] ) );
	const [eX1, eY1] = ( f_vec_add ( f_matrix_times ( rotMatrix, [rx1 * cos(t1+Δ), ry1 * sin(t1+Δ)] ), [cx,cy] ) );
	const fA = ( (  Δ > π ) ? 1 : 0 );
	const fS = 1 // ( (  Δ > 0 ) ? 1 : 0 );
	const fS2 = ( (  Δ > 0 ) ? 0 : 1 );
	let outerArc = "M " + sX1 + " " + sY1 + " A " + [ rx1 , ry1 , φ / (2*π) *360, fA, fS, eX1, eY1 ].join(" ")
	if (obj.fromLevel == 0) {
		let line = "L " + cx + " " + cy
		str = outerArc + line + " Z"
	} else {
		let rx2 = radius*(obj.fromLevel)/3
		let ry2 = radius*(obj.fromLevel)/3
		const [sX2, sY2] = ( f_vec_add ( f_matrix_times ( rotMatrix, [rx2 * cos(t1), ry2 * sin(t1)] ), [cx,cy] ) );
		const [eX2, eY2] = ( f_vec_add ( f_matrix_times ( rotMatrix, [rx2 * cos(t1+Δ), ry2 * sin(t1+Δ)] ), [cx,cy] ) );
		let innerArc = " A " + [ rx2 , ry2 , φ / (2*π) *360, fA, fS2, sX2, sY2 ].join(" ")
		let line1 = "L " + eX2 + " " + eY2 + " "
		let line2 = "L " + sX1 + " " + sY1 + " "
		str = outerArc + line1 + innerArc + line2 
	}
	return str
}

function addAreaSettings(e) {
	let settingsElm = document.querySelector('.settings')
	let newAreaSettingsElm = document.createElement('div')
	newAreaSettingsElm.classList.add('area-settings')
	newAreaSettingsElm.innerHTML = `
<select name="type" class="type-select" onchange="debounceRerender()">
						<option value="cyst">ציסטה</option>
						<option value="gush">גוש סולידי</option>
				</select>
				<span>בשעה</span>
				<select name="hour" class="hour-select" onchange="debounceRerender()">
						<option value="1">1</option>
						<option value="2">2</option>
						<option value="3">3</option>
						<option value="4">4</option>
						<option value="5">5</option>
						<option value="6">6</option>
						<option value="7">7</option>
						<option value="8">8</option>
						<option value="9">9</option>
						<option value="10">10</option>
						<option value="11">11</option>
						<option value="12">12</option>
				</select>
				<span>במרחק</span>
				<input type="number" class="dist-select" name="dist" min="0" max="7" step="0.1" value="0.1" onchange="debounceRerender()">
				<span>ס"מ מהפיטמה</span>
`
	settingsElm.insertBefore(newAreaSettingsElm, e.target)
}

function rerenderSVG() {
	let areas = []
	let areaSettingsElms = document.querySelectorAll('.area-settings')
	for (let i=0; i<areaSettingsElms.length; i++) {
		let elm = areaSettingsElms[i]
		let type = elm.querySelector('.type-select').value
		let hour = elm.querySelector('.hour-select').value
		let dist = elm.querySelector('.dist-select').value
		let isFar = dist>2
		areas.push({
			type,
			fromHour: Number(hour),
			toHour: Number(hour)+1,
			fromLevel: isFar? 1: 0,
			toLevel: isFar? 1: 2,
		})
	}
	renderAreas(areas)
}

function debounce(func, timeout = 300){
	let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}
const debounceRerender = debounce(rerenderSVG, 2000)
