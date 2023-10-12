const spatialPredicates = ['at', 'on'];  // You can update this list as required.

function isSpatialPredicate(word) {
    return spatialPredicates.includes(word);
}

function mergeDicts(dict1, dict2) {
    const merged = {};

    // Iterate over the keys of dict1 and add them to the merged result
    for (let key in dict1) {
        merged[key] = dict1[key];
    }

    // Iterate over the keys of dict2
    for (let key in dict2) {
        if (merged.hasOwnProperty(key)) {
            // If the key already exists in the merged result, add the value from dict2 to it
            merged[key] += dict2[key];
        } else {
            // If the key doesn't exist, just set the key-value pair from dict2
            merged[key] = dict2[key];
        }
    }

    return merged;
}



function getAllKeys(dataArray, subDictKeys=[]) {
    let allKeys = [];

    dataArray.forEach(data => {
        let currentDict = data;
        subDictKeys.forEach(key => {
            if (currentDict && currentDict.hasOwnProperty(key)) {
                currentDict = currentDict[key];
            } else {
                currentDict = null;
            }
        });

        if (currentDict) {
            allKeys = [...allKeys, ...Object.keys(currentDict)];
        }
    });

    return [...new Set(allKeys)]; // Removing duplicates by converting array to Set and then back to array
}

function computeCounts(data, allKeys) {
    const counts = {};
	allKeys.forEach(key => {
		counts[key] = 0;
	});

    for (let key in data) {
        let sumForKey = 0;

        for (let abstractnessKey in data[key]) {
            let sumForAbstractness = Object.values(data[key][abstractnessKey]).reduce(
                (sum, categoryData) => sum + Object.values(categoryData).reduce(
                    (sumCat, entryData) => sumCat + 
                        Object.values(entryData.subject).reduce((a, b) => a + b, 0) + 
                        Object.values(entryData.object).reduce((a, b) => a + b, 0), 0
                ), 0
            );

            sumForKey += sumForAbstractness;
        }

        counts[key] = sumForKey;
    }

    // Sorting keys based on their numerical values and constructing a sorted object
    const sortedCounts = {};
    Object.keys(counts).sort((a, b) => {
        const [aStart, aEnd] = a.split('-').map(Number);
        const [bStart, bEnd] = b.split('-').map(Number);

        if (aStart !== bStart) {
            return aStart - bStart;
        }
        return aEnd - bEnd;
    }).forEach(key => {
        sortedCounts[key] = counts[key];
    });

    return sortedCounts;
}

function computeCategoriesCounts(data, allKeys) {
    const counts = {};
	
	// Sort the keys by their string value
	allKeys.sort((a, b) => a.localeCompare(b));

	// Initialize the counts object
	allKeys.forEach(key => {
		counts[key] = 0;
	});

	// Calculate counts for each key
    for (let key in data) { 
		console.log(data[key]);
        counts[key] = Object.values(data[key]).reduce(
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
const margin = {top: 200, right: 200, bottom: 500, left: 400};
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

function normalizeData(data) {
    const total = Object.values(data).reduce((acc, val) => acc + val, 0);
    const normalized = {};
    
    for (let key in data) {
        normalized[key] = (data[key] / total) * 100;  // Convert to percentage
    }
    
    return normalized;
}

function drawBar(data, xOffset, total, isDetailed = false, barKeyClass) {
	// data = normalizeData(data);
    const proportions = toProportion(data, total);
	console.log(data, total);
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, barWidthDatasets]); // Adjusted for horizontal bars
    const barData = stackData(proportions);
    const className = barKeyClass ? `bar-${xOffset} ${barKeyClass}` : `bar-${xOffset}`;
	console.log(barData);
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
}



function drawOptions(data, xOffset, isDetailed = false, barKeyClass, height_multiplier = 1.0) {
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
        .attr("fill", "#91a9ff") // Constant color for all subbars
        .attr("stroke", "#0037ff") // Dark outline for the bars
        .attr("stroke-width", "2") // Outline width
        .attr("data-word", d => d);

    svg.selectAll(`.label-${xOffset}`)
        .data(uniqueValues)
        .join("text")
        .attr("class", `label-${xOffset}`)
        .attr("x", xOffset + barWidth / 2)
        .attr("y", (d, i) => (i + 0.5) * barHeight) // Center the label in the bar
        .attr("font-size", "40px") // Since each bar has equal height, we can set a constant font size
        .text(d => d)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle");
}




function addTitle(xOffset, title) {
    svg.append("text")
        .attr("x", xOffset + barWidth / 2)
        .attr("y", svgHeight + 40)
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
        .attr("x", xStart-100)
        .attr("y", 0-10)
        .attr("width", xEnd - xStart + barWidth + 20)
        .attr("height", svgHeight + 100)
        .attr("stroke", "#bababa")
        .attr("fill", "none")
        .attr("stroke-width", 20)
		.attr("class", "bounding-box");
}

function handleFade(clickedElement, className) {
    // Set the opacity of all bars in the group to fade out
    svg.selectAll(className)
        .attr("fill-opacity", 0.3);

    // Set the opacity of the clicked bar to 1 (or any other desired value)
    d3.select(clickedElement)
        .attr("fill-opacity", 1);
}



function drawMainChart(data, titles) {
	
	let abstractnessCounts = [];
	let allKeys = getAllKeys(data);
	var i = 0;
	while (i < data.length) {
		abstractnessCounts.push(computeCounts(data[i], allKeys));
		i++;
	}
	const totalAbstractnessCounts = d3.sum(Object.values(abstractnessCounts[0]));
	var bars_to_remove_0 = [];
	
	let cur_width_position = barWidth;
	let abstractness_width_position = cur_width_position;
	drawOptions(abstractnessCounts[0], cur_width_position);
	addTitle(cur_width_position, "Concreteness");
	
	
	cur_width_position += 1.2 * barWidth;
	i = 0;
	while (i < abstractnessCounts.length) {
		drawBar(abstractnessCounts[i], cur_width_position, totalAbstractnessCounts);
		addTitle(cur_width_position-50, titles[i]);
		cur_width_position += barWidthDatasets * 0.8;
		i++;
	}
	cur_width_position += barWidth
	let starting_position_after_abstractness = cur_width_position;
	
	svg.selectAll(`.bar-${abstractness_width_position}`).on("click", function(event, d) {
		let clickHistory = [];
		
		cur_width_position = starting_position_after_abstractness;
		const abstract = this.getAttribute("data-word");
		handleFade(this, `.bar-${abstractness_width_position}`);

		i = 0;
		while (i < bars_to_remove_0.length) {
			svg.selectAll(`.bar-${bars_to_remove_0[i]}`).remove();
			svg.selectAll(`.label-${bars_to_remove_0[i]}`).remove();
			i ++;
		}
		bars_to_remove_0 = [...new Set(bars_to_remove_0)]
		
		let predicateCounts = [];
		let allKeys = getAllKeys(data, [abstract]);
		var i = 0;
		while (i < data.length) {
			predicateCounts.push(computeCategoriesCounts(data[i][abstract], allKeys));
			i++;
		}
		const totalPredicateCounts = d3.sum(Object.values(predicateCounts[0]));
		
		var bars_to_remove_1 = [];
		
		let predicate_width_position = cur_width_position;
		bars_to_remove_0.push(cur_width_position);
		drawOptions(predicateCounts[0], cur_width_position);
		addTitle(cur_width_position, "Categories");
		
		
		cur_width_position += 1.2 * barWidth;
		i = 0;
		while (i < predicateCounts.length) {
			bars_to_remove_0.push(cur_width_position);
			drawBar(predicateCounts[i], cur_width_position, totalPredicateCounts);
			addTitle(cur_width_position-50, titles[i]);
			cur_width_position += barWidthDatasets * 0.8;
			i++;
		}
		cur_width_position += barWidth
		let starting_position_after_predicate = cur_width_position;
		
		svg.selectAll(`.bar-${predicate_width_position}`).on("click", function(event, d) {
			cur_width_position = starting_position_after_predicate;
			const prep = this.getAttribute("data-word");
			handleFade(this, `.bar-${predicate_width_position}`);
			i = 0;
			while (i < bars_to_remove_1.length) {
				svg.selectAll(`.bar-${bars_to_remove_1[i]}`).remove();
				svg.selectAll(`.label-${bars_to_remove_1[i]}`).remove();
				i ++;
			}
			bars_to_remove_1 = [...new Set(bars_to_remove_1)]
			
			let allKeys = getAllKeys(data, [abstract, prep]);
			const categories = {};
			allKeys.forEach(key => {
				categories[key] = 0;
			});
			for(let category in data[0][abstract][prep]) {
				categories[category] = Object.values(data[0][abstract][prep][category]).reduce(
					(sumCat, entryData) => sumCat + Object.values(entryData.subject).reduce((a, b) => a + b, 0) + 
					Object.values(entryData.object).reduce((a, b) => a + b, 0), 0
				);
			}

			const totalCategories = d3.sum(Object.values(categories));
			let categories_width_position = cur_width_position;
			// console.log(categories);
			bars_to_remove_0.push(cur_width_position);
			bars_to_remove_1.push(cur_width_position);
			drawOptions(categories, cur_width_position);
			addTitle(cur_width_position, "Prepositions");
			cur_width_position += 1.2 * barWidth;
			
			i = 0;
			while (i < data.length) {
				const categories = {};
				allKeys.forEach(key => {
					categories[key] = 0;
				});
				for(let category in data[i][abstract][prep]) {
					categories[category] = Object.values(data[i][abstract][prep][category]).reduce(
						(sumCat, entryData) => sumCat + Object.values(entryData.subject).reduce((a, b) => a + b, 0) + 
						Object.values(entryData.object).reduce((a, b) => a + b, 0), 0
					);
				}
				const totalCategories = d3.sum(Object.values(categories));
				let categories_width_position = cur_width_position;
				// console.log(categories);
				bars_to_remove_0.push(cur_width_position);
				bars_to_remove_1.push(cur_width_position);
				drawBar(categories, cur_width_position, totalCategories);
				addTitle(cur_width_position-50, titles[i]);
				// addTitle(cur_width_position, "Prepositions");
				cur_width_position += barWidthDatasets * 0.8;
				i++;
			}
			
			cur_width_position += 5 * barWidth
			
			let starting_position_after_categories = cur_width_position;
			
			var bars_to_remove_2 = [];
			svg.selectAll(`.bar-${categories_width_position}`).on("click", function(event, d) {
				cur_width_position = starting_position_after_categories
				// drawHorizontalArrow(4 * barWidth, 6 * barWidth - 10);
				// drawBoundingBox(6 * barWidth, 10 * barWidth);
				const category = this.getAttribute("data-word");
				handleFade(this, `.bar-${categories_width_position}`);
				i = 0;
				while (i < bars_to_remove_2.length) {
					svg.selectAll(`.bar-${bars_to_remove_2[i]}`).remove();
					svg.selectAll(`.label-${bars_to_remove_2[i]}`).remove();
					i ++;
				}

				const predicates = {};
				let allKeys = getAllKeys(data, [abstract, prep, category]);
				allKeys.forEach(key => {
					predicates[key] = 0;
				});
				for(let predicate in data[0][abstract][prep][category]) {
					predicates[predicate] = Object.values(data[0][abstract][prep][category][predicate].subject).reduce((a, b) => a + b, 0) + 
					Object.values(data[0][abstract][prep][category][predicate].object).reduce((a, b) => a + b, 0);
				}

				const totalPredicates = d3.sum(Object.values(predicates));
				bars_to_remove_0.push(cur_width_position);
				bars_to_remove_1.push(cur_width_position);
				bars_to_remove_2.push(cur_width_position);
				drawOptions(predicates, cur_width_position, true, "predicates-bar");
				addTitle(cur_width_position, "Predicates");
				cur_width_position += 1.2 * barWidth;
				
				
				i = 0;
				while (i < data.length) {
					const predicates = {};
					allKeys.forEach(key => {
						predicates[key] = 0;
					});
					for(let predicate in data[i][abstract][prep][category]) {
						predicates[predicate] = Object.values(data[i][abstract][prep][category][predicate].subject).reduce((a, b) => a + b, 0) + 
						Object.values(data[i][abstract][prep][category][predicate].object).reduce((a, b) => a + b, 0);
					}
					bars_to_remove_0.push(cur_width_position);
					bars_to_remove_1.push(cur_width_position);
					bars_to_remove_2.push(cur_width_position);
					drawBar(predicates, cur_width_position, totalPredicates, true, "predicates-bar");
					addTitle(cur_width_position-50, titles[i]);
					// addTitle(cur_width_position, "Predicates");
					cur_width_position += barWidthDatasets * 0.8;
					i++;
				}
				cur_width_position += barWidth
				
				// New: Handle click event on each predicate
				let starting_position_after_predicates = cur_width_position;
				var bars_to_remove_3 = [];
				let cur_width_subjects_position = starting_position_after_categories - 4 * barWidth;
				let starting_width_subjects_position = cur_width_subjects_position;
				let cur_width_objects_position = cur_width_position + 2 * barWidth
				let starting_width_objects_position = cur_width_objects_position;
				drawBoundingBox(cur_width_subjects_position - 50, cur_width_objects_position + 50);
				svg.selectAll(".predicates-bar").on("click", function(event, d) {
					cur_width_subjects_position = starting_width_subjects_position;
					cur_width_objects_position = starting_width_objects_position;
					
					const predicate = this.getAttribute("data-word");
					handleFade(this, ".predicates-bar");
					i = 0;
					while (i < bars_to_remove_3.length) {
						svg.selectAll(`.bar-${bars_to_remove_3[i]}`).remove();
						svg.selectAll(`.label-${bars_to_remove_3[i]}`).remove();
						i ++;
					}
					
					const subjectsKeysSet = new Set();
					const objectsKeysSet = new Set();
					i = 0;
					while (i < data.length) {
					    if (data[i][abstract] && data[i][abstract][prep] && data[i][abstract][prep][category] && data[i][abstract][prep][category][predicate]) {
					        const subjects = data[i][abstract][prep][category][predicate].subject;
					        const objects = data[i][abstract][prep][category][predicate].object;
					
					        if (subjects) {
					            Object.keys(subjects).forEach(key => subjectsKeysSet.add(key));
					        }
					
					        if (objects) {
					            Object.keys(objects).forEach(key => objectsKeysSet.add(key));
					        }
					    }
					    i++;
					}
					const subjectsKeys = [...subjectsKeysSet];
					const objectsKeys = [...objectsKeysSet];

					var subjectAll = {};
					subjectsKeys.forEach(key => {
						subjectAll[key] = 0;
					});
					var objectAll = {};
					objectsKeys.forEach(key => {
						objectAll[key] = 0;
					});
					
					// i = 0;
					// while (i < data.length) {
					// 	if (data[i][abstract] && data[i][abstract][prep] && data[i][abstract][prep][category] && data[i][abstract][prep][category][predicate]) {
					// 		var subjects = data[i][abstract][prep][category][predicate].subject;
					// 		var objects = data[i][abstract][prep][category][predicate].object;
					// 		subjectAll = mergeDicts(subjects, subjectAll);
					// 		objectAll = mergeDicts(objects, objectAll);
					// 	}
					// }
					// console.log(1111, subjectAll)
					const totalSubjects = d3.sum(Object.values(subjectAll));
					const totalObjects = d3.sum(Object.values(objectAll));
					
					// subjectsKeys.forEach(key => {
					// 	subjectAll[key] = 0;
					// });
					// objectsKeys.forEach(key => {
					// 	objectAll[key] = 0;
					// });
					
					bars_to_remove_0.push(cur_width_subjects_position);
					bars_to_remove_1.push(cur_width_subjects_position);
					bars_to_remove_2.push(cur_width_subjects_position);
					bars_to_remove_3.push(cur_width_subjects_position);
					drawOptions(subjectAll, cur_width_subjects_position, true);
					addTitle(cur_width_subjects_position, "Subject phrases");

					bars_to_remove_0.push(cur_width_objects_position);
					bars_to_remove_1.push(cur_width_objects_position);
					bars_to_remove_2.push(cur_width_objects_position);
					bars_to_remove_3.push(cur_width_objects_position);
					drawOptions(objectAll, cur_width_objects_position, true);
					addTitle(cur_width_objects_position, "Object phrases");
					
					cur_width_subjects_position += 1.2 * barWidth;
					cur_width_objects_position += 1.2 * barWidth;
					
					i = 0;
					while (i < data.length) {
						if (data[i][abstract] && data[i][abstract][prep] && data[i][abstract][prep][category] && data[i][abstract][prep][category][predicate]) {
							var subjects = data[i][abstract][prep][category][predicate].subject;
							var objects = data[i][abstract][prep][category][predicate].object;
							subjects = mergeDicts(subjects, subjectAll);
							objects = mergeDicts(objects, objectAll);
						}
						else {
							subjects = subjectAll;
							objects = objectAll;
						}
						
						const totalSubjects = d3.sum(Object.values(subjects));
						const totalObjects = d3.sum(Object.values(objects));
						
						bars_to_remove_0.push(cur_width_subjects_position);
						bars_to_remove_1.push(cur_width_subjects_position);
						bars_to_remove_2.push(cur_width_subjects_position);
						bars_to_remove_3.push(cur_width_subjects_position);
						drawBar(subjects, cur_width_subjects_position, totalSubjects, true);
						addTitle(cur_width_subjects_position-50, titles[i]);
						// addTitle(starting_position_after_categories - 4 * barWidth, "Subject phrases");
						
						bars_to_remove_0.push(cur_width_objects_position);
						bars_to_remove_1.push(cur_width_objects_position);
						bars_to_remove_2.push(cur_width_objects_position);
						bars_to_remove_3.push(cur_width_objects_position);
						drawBar(objects, cur_width_objects_position, totalObjects, true);
						addTitle(cur_width_objects_position-50, titles[i]);
						// addTitle(cur_width_position + 2 * barWidth, "Object phrases");
						cur_width_subjects_position += barWidthDatasets * 0.8;
						cur_width_objects_position += barWidthDatasets * 0.8;
						i++;
					}
					drawBoundingBox(starting_width_subjects_position - 50, cur_width_objects_position + 50);
				});
			});
		});
	});
}

function init(bigrams, titles) {
    drawMainChart(bigrams, titles);
}

// function transformData(originalData) {
//     let transformedData = {};

//     for (let preposition in originalData) {
//         for (let category in originalData[preposition]) {
//             if (!transformedData[category]) {
//                 transformedData[category] = {};
//             }
//             transformedData[category][preposition] = originalData[preposition][category];
//         }
//     }

//     return transformedData;
// }

Promise.all([
    d3.json("bigrams_mad.json"),
    d3.json("bigrams_ego4d.json"),
	d3.json("bigrams_laion.json")
])
.then(([dataMad, dataEgo, dataLaion]) => {
    const inputData = [dataMad, dataEgo, dataLaion];
	const titles = ['MADv2', 'EGO4D', 'LAION']
    init(inputData, titles);
})
.catch(error => {
    console.error("Error loading the JSON files:", error);
});
