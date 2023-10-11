const spatialPredicates = ['at', 'on'];  // You can update this list as required.

function isSpatialPredicate(word) {
    return spatialPredicates.includes(word);
}

function computePredicateCounts(data) {
    const counts = {};
    for (let predicate in data) { 
		console.log(data[predicate]);
        counts[predicate] = Object.values(data[predicate]).reduce(
            (sum, categoryData) => sum + Object.values(categoryData).reduce(
                (sumCat, entryData) => sumCat + Object.values(entryData.subject).reduce((a, b) => a + b, 0) + 
                Object.values(entryData.object).reduce((a, b) => a + b, 0), 0
            ), 0
        );
    }
    return counts;
}

function toProportion(data, total) {
    let result = {};
    for (let [key, value] of Object.entries(data)) {
        result[key] = total ? (value / total) * 100 : 0;
    }
    return result;
}

function stackData(data) {
    let stacked = [];
    let yOffset = 0;

    for (let [word, count] of Object.entries(data)) {
        let yEnd = yOffset + count;
        stacked.push({word, yOffset, yEnd});
        yOffset = yEnd;
    }
    return stacked;
}
const svgWidth = 15000;
const svgHeight = 1600;
const margin = {top: 20, right: 20, bottom: 30, left: 40};
const refWidth = 1500*2;
const optionWidth = refWidth / 12;
const barWidth = refWidth / 12;
const barWidthDatasets = refWidth / 12;

function desaturateAndLighten(color, saturationProportion, lightnessIncrease) {
    const hsl = d3.hsl(color);
    hsl.s *= saturationProportion;  // Reduce saturation
    hsl.l += lightnessIncrease;     // Increase lightness
    return hsl;
}
const colors = d3.scaleOrdinal(d3.schemeCategory10.map(col => desaturateAndLighten(col, 0.7, 0.2)));
const options_colors = d3.scaleOrdinal(d3.schemeCategory10.map(col => desaturateAndLighten(col, 0.3, 0.4)));


const svg = d3.select("#chart")
    .append("svg")
    .attr("width", svgWidth + margin.left + margin.right)
    .attr("height", svgHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function stackData(data) {
    let stacked = [];
    let yOffset = 0;
    for (let [word, count] of Object.entries(data)) {
        let yEnd = yOffset + count;
        stacked.push({word, yOffset, yEnd});
        yOffset = yEnd;
    }
    return stacked;
}

function drawBar(data, xOffset, total, isDetailed = false, barKeyClass) {
    const proportions = toProportion(data, total);
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, barWidthDatasets]); // Adjusted for horizontal bars
    const barData = stackData(proportions);
    const className = barKeyClass ? `bar-${xOffset} ${barKeyClass}` : `bar-${xOffset}`;

    const barHeight = svgHeight / barData.length; // Height of each individual bar

    svg.selectAll(`.${className}`)
        .data(barData)
        .join("rect")
        .attr("class", className)
        .attr("y", (d, i) => i * barHeight) // Adjusted for horizontal bars
        .attr("x", xOffset)
        .attr("height", barHeight - 4) // 4 is a small gap between bars
        .attr("width", d => xScale(d.yEnd - d.yOffset)) // Adjusted for horizontal bars
        .attr("fill", d => colors(d.word))
        .attr("data-word", d => d.word);

    // svg.selectAll(`.label-${xOffset}`)
    //         .data(barData)
    //         .join("text")
    //         .attr("class", `label-${xOffset}`)
    //         .attr("y", (d, i) => (i + 0.5) * barHeight) // Centered in the bar
    //         .attr("x", d => xOffset + xScale(d.yEnd - d.yOffset) / 2) // Centered in the bar's width
    //         .attr("font-size", 20)
    //         .attr("text-anchor", "middle") // Centered text
    //         .attr("alignment-baseline", "middle")
    //         .each(function(d) {
    //             const text = d3.select(this);
    //             text.append("tspan")
    //                 .attr("y", (d, i) => (i + 0.5) * barHeight)
    //                 .attr("x", xOffset + xScale(d.yEnd - d.yOffset) / 2)
    //                 .text(d.word);
    //             text.append("tspan")
    //                 .attr("font-size", 15)
    //                 .attr("y", (d, i) => (i + 0.5) * barHeight)
    //                 .attr("x", xOffset + xScale(d.yEnd - d.yOffset) / 2)
    //                 .attr("dy", "1em")  // This moves the tspan down by 1 line
    //                 .text(`${proportions[d.word].toFixed(2)}%`);
    //         });
}



function drawOptions(data, xOffset, isDetailed = false, barKeyClass) {
    const uniqueValues = Object.keys(data);
    const equalProportion = 100 / uniqueValues.length; // Equal proportion for each unique value
    const barHeight = svgHeight / uniqueValues.length; // Equal height for each bar

    const className = barKeyClass ? `bar-${xOffset} ${barKeyClass}` : `bar-${xOffset}`;

    svg.selectAll(`.${className}`)
        .data(uniqueValues)
        .join("rect")
        .attr("class", className)
        .attr("x", xOffset)
        .attr("y", (d, i) => i * barHeight)
        .attr("width", barWidth)
        .attr("height", barHeight)
        .attr("fill", d => options_colors(d))
        .attr("data-word", d => d);

    svg.selectAll(`.label-${xOffset}`)
        .data(uniqueValues)
        .join("text")
        .attr("class", `label-${xOffset}`)
        .attr("x", xOffset + barWidth / 2)
        .attr("y", (d, i) => (i + 0.5) * barHeight) // Center the label in the bar
        .attr("font-size", "30px") // Since each bar has equal height, we can set a constant font size
        .text(d => d)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle");
}



function addTitle(xOffset, title) {
    svg.append("text")
        .attr("x", xOffset + barWidth / 2)
        .attr("y", svgHeight + 20)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", "50px")
        .text(title);
}


svg.append("defs")
    .append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 5)
    .attr("refY", 0)
    .attr("markerWidth", 4)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#000");


function drawHorizontalArrow(fromX, toX) {
    svg.append("line")
        .attr("x1", fromX + barWidth + 20)
        .attr("y1", svgHeight / 2)
        .attr("x2", toX - 20)
        .attr("y2", svgHeight / 2)
        .attr("stroke-width", 4)
        .attr("stroke", "#000")
        .attr("marker-end", "url(#arrow)");
}
function drawBoundingBox(xStart, xEnd) {
	svg.selectAll(".bounding-box").remove();
    svg.append("rect")
        .attr("x", xStart-10)
        .attr("y", 0-10)
        .attr("width", xEnd - xStart + barWidth + 20)
        .attr("height", svgHeight + 40)
        .attr("stroke", "black")
        .attr("fill", "none")
        .attr("stroke-width", 4)
		.attr("class", "bounding-box");
}

function drawMainChart(data) {
	let predicateCounts = [];
	var i = 0;
	while (i < data.length) {
	    predicateCounts.push(computePredicateCounts(data[i]));
	    i++;
	}
    const totalPredicateCounts = d3.sum(Object.values(predicateCounts[0]));
	
	var bars_to_remove_0 = [];
	
	let cur_width_position = 2 * barWidth;
	let predicate_width_position = cur_width_position;
    drawOptions(predicateCounts[0], cur_width_position);
	addTitle(cur_width_position, "Categories");
	
	
	cur_width_position += 1.2 * barWidth;
	i = 0;
	while (i < predicateCounts.length) {
		console.log(predicateCounts[i]);
		// bars_to_remove.push(cur_width_position);
	    drawBar(predicateCounts[i], cur_width_position, totalPredicateCounts);
		console.log(barWidth);
		cur_width_position += barWidthDatasets * 0.8;
	    i++;
	}
    cur_width_position += barWidth
	let starting_position_after_predicate = cur_width_position;

    svg.selectAll(`.bar-${predicate_width_position}`).on("click", function(event, d) {
		
		cur_width_position = starting_position_after_predicate;
		
        const prep = this.getAttribute("data-word");
		
		i = 0;
		while (i < bars_to_remove_0.length) {
			svg.selectAll(`.bar-${bars_to_remove_0[i]}`).remove();
			svg.selectAll(`.label-${bars_to_remove_0[i]}`).remove();
			i ++;
		}
		bars_to_remove_0 = [...new Set(bars_to_remove_0)]
		
        const categories = {};
        for(let category in data[0][prep]) {
            categories[category] = Object.values(data[0][prep][category]).reduce(
                (sumCat, entryData) => sumCat + Object.values(entryData.subject).reduce((a, b) => a + b, 0) + 
                Object.values(entryData.object).reduce((a, b) => a + b, 0), 0
            );
        }

        const totalCategories = d3.sum(Object.values(categories));
		let categories_width_position = cur_width_position;
		// console.log(categories);
		bars_to_remove_0.push(cur_width_position);
        drawOptions(categories, cur_width_position);
        addTitle(cur_width_position, "Prepositions");
		cur_width_position += 1.0 * barWidth;
		
		i = 0;
		while (i < data.length) {
			const categories = {};
			for(let category in data[i][prep]) {
			    categories[category] = Object.values(data[i][prep][category]).reduce(
			        (sumCat, entryData) => sumCat + Object.values(entryData.subject).reduce((a, b) => a + b, 0) + 
			        Object.values(entryData.object).reduce((a, b) => a + b, 0), 0
			    );
			}
			const totalCategories = d3.sum(Object.values(categories));
			let categories_width_position = cur_width_position;
			// console.log(categories);
			bars_to_remove_0.push(cur_width_position);
			drawBar(categories, cur_width_position, totalCategories);
			// addTitle(cur_width_position, "Prepositions");
			cur_width_position += barWidthDatasets * 0.6;
			i++;
		}
		cur_width_position += 5 * barWidth
		
		let starting_position_after_categories = cur_width_position;
		
		var bars_to_remove_1 = [];
        svg.selectAll(`.bar-${categories_width_position}`).on("click", function(event, d) {
			cur_width_position = starting_position_after_categories
            // drawHorizontalArrow(4 * barWidth, 6 * barWidth - 10);
			// drawBoundingBox(6 * barWidth, 10 * barWidth);
			const category = this.getAttribute("data-word");

			i = 0;
			while (i < bars_to_remove_1.length) {
				svg.selectAll(`.bar-${bars_to_remove_1[i]}`).remove();
				svg.selectAll(`.label-${bars_to_remove_1[i]}`).remove();
				i ++;
			}
			console.log(bars_to_remove_1);

            const predicates = {};
			for(let predicate in data[0][prep][category]) {
				predicates[predicate] = Object.values(data[0][prep][category][predicate].subject).reduce((a, b) => a + b, 0) + 
				Object.values(data[0][prep][category][predicate].object).reduce((a, b) => a + b, 0);
			}

			const totalPredicates = d3.sum(Object.values(predicates));
			bars_to_remove_0.push(cur_width_position);
			bars_to_remove_1.push(cur_width_position);
			drawOptions(predicates, cur_width_position, true, "predicates-bar");
			addTitle(cur_width_position, "Predicates");
			cur_width_position += 1.2 * barWidth;
			
			
			i = 0;
			while (i < data.length) {
				const predicates = {};
				for(let predicate in data[i][prep][category]) {
					predicates[predicate] = Object.values(data[i][prep][category][predicate].subject).reduce((a, b) => a + b, 0) + 
					Object.values(data[i][prep][category][predicate].object).reduce((a, b) => a + b, 0);
				}
				bars_to_remove_0.push(cur_width_position);
				bars_to_remove_1.push(cur_width_position);
				drawBar(predicates, cur_width_position, totalPredicates, true, "predicates-bar");
				// addTitle(cur_width_position, "Predicates");
				cur_width_position += barWidthDatasets * 0.6;
				i++;
			}
			cur_width_position += barWidth
			
			// New: Handle click event on each predicate
			let starting_position_after_predicates = cur_width_position;
			var bars_to_remove_2 = [];
			let cur_width_subjects_position = starting_position_after_categories - 4 * barWidth;
			let starting_width_subjects_position = cur_width_subjects_position;
			let cur_width_objects_position = cur_width_position + 2 * barWidth
			let starting_width_objects_position = cur_width_objects_position;
			drawBoundingBox(cur_width_subjects_position - 50, cur_width_objects_position + 50);
			svg.selectAll(".predicates-bar").on("click", function(event, d) {
				cur_width_subjects_position = starting_width_subjects_position;
				cur_width_objects_position = starting_width_objects_position;
				
				const predicate = this.getAttribute("data-word");

				i = 0;
				while (i < bars_to_remove_2.length) {
					svg.selectAll(`.bar-${bars_to_remove_2[i]}`).remove();
					svg.selectAll(`.label-${bars_to_remove_2[i]}`).remove();
					i ++;
				}
				console.log(bars_to_remove_2);

				const subjects = data[0][prep][category][predicate].subject;
				const objects = data[0][prep][category][predicate].object;

				const totalSubjects = d3.sum(Object.values(subjects));
				const totalObjects = d3.sum(Object.values(objects));

				bars_to_remove_0.push(cur_width_subjects_position);
				bars_to_remove_1.push(cur_width_subjects_position);
				bars_to_remove_2.push(cur_width_subjects_position);
				drawOptions(subjects, cur_width_subjects_position, true);
				addTitle(cur_width_subjects_position, "Subject phrases");

				bars_to_remove_0.push(cur_width_objects_position);
				bars_to_remove_1.push(cur_width_objects_position);
				bars_to_remove_2.push(cur_width_objects_position);
				drawOptions(objects, cur_width_objects_position, true);
				addTitle(cur_width_objects_position, "Object phrases");
				
				cur_width_subjects_position += 1.2 * barWidth;
				cur_width_objects_position += 1.2 * barWidth;
				
				i = 0;
				while (i < data.length) {
					const subjects = data[i][prep][category][predicate].subject;
					const objects = data[i][prep][category][predicate].object;
					
					const totalSubjects = d3.sum(Object.values(subjects));
					const totalObjects = d3.sum(Object.values(objects));
					
					bars_to_remove_0.push(cur_width_subjects_position);
					bars_to_remove_1.push(cur_width_subjects_position);
					bars_to_remove_2.push(cur_width_subjects_position);
					drawBar(subjects, cur_width_subjects_position, totalSubjects, true);
					// addTitle(starting_position_after_categories - 4 * barWidth, "Subject phrases");
					
					bars_to_remove_0.push(cur_width_objects_position);
					bars_to_remove_1.push(cur_width_objects_position);
					bars_to_remove_2.push(cur_width_objects_position);
					drawBar(objects, cur_width_objects_position, totalObjects, true);
					// addTitle(cur_width_position + 2 * barWidth, "Object phrases");
					cur_width_subjects_position += barWidthDatasets * 0.6;
					cur_width_objects_position += barWidthDatasets * 0.6;
					i++;
				}
				drawBoundingBox(starting_width_subjects_position - 50, cur_width_objects_position + 50);
			});
        });
    });
}

function init(bigrams) {
    drawMainChart(bigrams);
}

function transformData(originalData) {
    let transformedData = {};

    for (let preposition in originalData) {
        for (let category in originalData[preposition]) {
            if (!transformedData[category]) {
                transformedData[category] = {};
            }
            transformedData[category][preposition] = originalData[preposition][category];
        }
    }

    return transformedData;
}

d3.json("bigrams.json").then(data => {
    const transformedData = transformData(data);
	const inputData = Array(transformedData, transformedData);
    init(inputData);
}).catch(error => {
    console.error("Error loading the bigrams.json file:", error);
});
