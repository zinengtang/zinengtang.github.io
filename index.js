window.onload = function () {
  // setup nav
  $(".navbar-toggle").click(function(){
    if ($(".navbar-collapse").hasClass("collapse")) {
      $(".navbar-collapse").removeClass("collapse");
    } else {
      $(".navbar-collapse").addClass("collapse");
    }
  })

  function hideAll() {
    if (!$(".navbar-collapse").hasClass("collapse")) {
      $(".navbar-collapse").addClass("collapse");
    }
    window.scrollTo(0, 0);
    $("#info").hide();
    $("#intro").hide();
    $("#publication").hide();
    $("#education").hide();
    $("#experience").hide();
    $("#service").hide();
    $("#demo").hide();
    $("#honorship").hide();
    $("#talks").hide();
    $("#teaching").hide();
    $("#personal").hide();
  }

  hideAll();
  $("#info").show();
  $("#intro").show();

  $("#home-button").click(function(){
    hideAll();
    $("#info").show();
    $("#intro").show();
  })

  $("#background-button").click(function(){
    hideAll();
    $("#education").show();
    $("#experience").show();
  })

  $("#pub-button").click(function(){
    hideAll();
    $("#publication").show();
  })

  // $("#service-button").click(function(){
  //   hideAll();
  //   $("#service").show();
  // })

  // $("#demo-button").click(function(){
  //   hideAll();
  //   $("#demo").show();
  // })

  $("#others-button").click(function(){
    hideAll();
    $("#honorship").show();
    // $("#talks").show();
    // $("#teaching").show();
    // $("#personal").hide();
  })

  // load intro
  let introText = "";
  for (let i=0; i<intros.length; i++) {
    let text = intros[i];
    while (text.indexOf('[')>-1) {
      let start = text.indexOf('[');
      let end = text.indexOf(']')
      key = text.substring(start+1, end);
      console.assert(key in people);
      text =  text.substring(0, start) + "<a href='" + people_website[key] + "' target='_blank'>" + people[key] + "</a>" + text.substring(end+1, text.length);
    }
    introText += text; 
	// + `<h4 style="font-size: 150%">News</h4><div id='news-text'></div>`;
  }
  function _add_button(button_id, button_text) {
    return `<span id='` + button_id + `' style='
      cursor: pointer;
      margin-left: 10px;
    '>
    [<a>` + button_text + `</a>]
    </span>`;
  }
  // introText += _add_button('news-load', 'Load all') + _add_button('news-collapse', 'Collapse');
  document.getElementById("intro-text").innerHTML += introText;

  // // load news
  // function _load_news(n_news) {
  //   let newsText = "";
  //   for (let i=0; i<n_news; i++) {
  //     newsText += "<p id='news-" + i + "'><span class='glyphicon glyphicon-ok'></span> " + news[i] + "</p>";
  //   }
  //   newsText += "<p style='margin-top: 5px'>";
  //   document.getElementById("news-text").innerHTML = newsText;
  // }
  // _load_news(1);
  
  // control # of news to show
  $('#news-collapse').hide();
  $('#news-load').click(function(){
    _load_news(news.length);
    $('#news-collapse').show();
    $('#news-load').hide();
  })
  $('#news-collapse').click(function(){
    _load_news(1);
    $('#news-collapse').hide();
    $('#news-load').show();
  })

  // load publications
  let pubText = "";
  let ordered_options = ["paper", "website", "code", "demo", "slides", "talk", "poster"];
  
  let papers = publications;

  //for (let i=0; i<publications.length; i++) {
  //console.assert(publications[i].length===3);
  //pubText += "<h4><em>" + publications[i][0] + "</em></h4>";
  //let papers = publications[i][2];
  for (let j=0; j<papers.length; j++) {
    let paper = papers[j];
    let isFirst = j===0 || paper[4]!=papers[j-1][4];

    if (isFirst) {
      pubText += "<h4 class='year'>" + paper[4] + "</h4>";
      pubText += "<h4 class='first'>" + paper[0] + "</h4>"; // title
    } else {
      pubText += "<h4>" + paper[0] + "</h4>"; // title
    }
    pubText += "<p>"; //authors
    for (let k=0; k<paper[1].length; k++) {
      let author = paper[1][k];
      if (k>0) {
        pubText += ", ";
      }
      if (author.endsWith('*')) {
        pubText += people[author.substring(0, author.length-1)]+"*";
      } else {
        if (author in people) {
          pubText += people[author];
        } else {
          pubText += author;
        }
      }
    }
    pubText += "</p>"
    pubText += "<p>"
    let keyword;
    if (paper[2].startsWith("arXiv") || paper[2].includes("Tutorial")) {
      // arxiv
      pubText += "<em>"+paper[2]+"</em>. "+paper[4]+". ";
      keyword = paper[5];
    } else {
      // proceedings
      //pubText += "In: <em> Proceedings of "+paper[2]+"</em>. "+paper[3]+". "+paper[4]+". ";
      pubText += "In: <em> Proceedings of "+paper[2]+"</em>. "+paper[4]+". ";
      keyword = paper[5];
    }

    // optional things
    let optional_dict = pub_dictionary[keyword];
    for (let k=0; k<ordered_options.length; k++) {
      if (ordered_options[k] in optional_dict) {
        let key = ordered_options[k];
        let value = optional_dict[key];
        if (key==="slides" || key==="poster") {
          value = "assets/slides/"+value;
        }
        pubText += "[<a href='"+value+"' target='_blank'>"+key+"</a>] ";
      }
    }
    // var bibtex = "assets/bibtex/"+keyword+".txt";
    // if ("BibTeX" in optional_dict) {
    //   bibtex = optional_dict["BibTeX"]
    // }
    // pubText += "[<a href='" + bibtex + "' target='_blank'>BibTeX</a>] ";
    pubText += "</p>"
  }
  //}
  document.getElementById("publication").innerHTML += "*: equal contribution" +pubText;
  // load education
  let eduText = "";
  for (let i=0; i<educations.length; i++) {
    console.assert(educations[i].length == 3);
    eduText += "<h4>" + educations[i][0] + " <sup>" + educations[i][1] + "</sup></h4>";
    for (let j=0; j<educations[i][2].length; j++) {
      eduText += "<p>" + educations[i][2][j] + "</p>";
    }
  }
  document.getElementById("education").innerHTML += eduText;
  // load experiences
  let expText = "";
  for (let i=0; i<experiences.length; i++) {
    console.assert(experiences[i].length == 4);
    let verb = "supervised"; //(experiences[i][0].includes("University")) ? "advised" : "mentored";
    expText += "<h4>" + experiences[i][0] + " <sup>" + experiences[i][1] + "</sup></h4>";
    expText += "<p>" + experiences[i][2] + ", " + verb + " by ";
    for (let j=0; j<experiences[i][3].length; j++) {
      if (j>0 && j===experiences[i][3].length-1) {
        expText += " and ";
      } else if (j>0) {
        expText += ", ";
      }
      let mentor = experiences[i][3][j]
      expText += "<a href='" + people_website[mentor] + "' target='_blank'>" + people[mentor] + "</a>";
    }
    expText += "</p>";
  }
  document.getElementById("experience").innerHTML += expText;

  //load demos
  // let demoText = "<center>" + demoIntro + "</center><br />";
  // for (let i=0; i<demos.length; i++) {
  //   let demoLink = "http://qa.cs.washington.edu:" + demos[i][0];
  //   let title = demos[i][1];
  //   let method = demos[i][2];

  //   demoText += `<div class="row">
  //     <center style="margin-bottom: 5px;">
  //       <span style="font-size: 140%">` + title + `</span></br />
  //       <em>Using ` + method + `</em><br />
  //       <a href="` + demoLink + `" target="_blank">` + demoLink.split("http://")[1] + `</a>
  //     </center>
  //     <div class="wrap">
  //       <iframe class="frame" src="` + demoLink + `" title="` + title + `"></iframe>
  //     </div>
  //   </div>`;
  // }
  // document.getElementById("demo").innerHTML += demoText;

  // load honors
  let honorText = "";
  for (let i=0; i<honors.length; i++) {
    honorText += "<li>" + honors[i] + "</li>";
  }
  document.getElementById("honorship").innerHTML += "<ul>" + honorText + "</ul>";
  // load services
  let serviceText = "";
  for (let i=0; i<services.length; i++) {
    serviceText += "<li>" + services[i] + "</li>";
  }
  // document.getElementById("service").innerHTML += "<ul>" + serviceText + "</ul>";
  // // load talks
  // let talksText = "";
  // for (let i=0; i<talks.length; i++) {
  //   talksText += "<li>" + talks[i] + "</li>";
  // }
  // document.getElementById("talks").innerHTML += "<ul>" + talksText + "</ul>";
  // // load services
  // let teachingText = "";
  // for (let i=0; i<teaching.length; i++) {
  //   teachingText += "<p>" + teaching[i] + "</p>";
  // }
  // document.getElementById("teaching").innerHTML += teachingText;


};
