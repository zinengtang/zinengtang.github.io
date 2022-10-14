let people = {
  'zineng': "<strong class='thicker'>Zineng Tang</strong>",
  'mohit': "Mohit Bansal",
  'ziyi': "Ziyi Yang",
  'jaemin': "Jaemin Cho",
  'jie': "Jie Lei",
  'yixin': "Yixin Nie",
  'hyounghun': "Hyounghun Kim",
  'shiyue': "Shiyue Zhang",
  'uncnlp': 'UNC-NLP',
  'murgelab': 'MURGe-Lab',
};

let people_website = {
  'mohit': "https://www.cs.unc.edu/~mbansal/",
  'uncnlp': 'https://nlp.cs.unc.edu/',
  'murgelab': 'https://murgelab.cs.unc.edu/',
  'ziyi': 'https://web.stanford.edu/~zy99/',
  'jaemin': 'https://j-min.io/',
  'jie': 'https://jayleicn.github.io/',
  'hyounghun': "https://hyounghk.github.io/",
  'shiyue': "https://www.cs.unc.edu/~shiyue/"
};

let pub_dictionary = {
  "densecap": {'paper': "https://arxiv.org/pdf/2005.06409.pdf",
                'code': "https://github.com/hyounghk/VideoQADenseCapFrameGate-ACL2020"},
  "decembert": {'paper': "https://aclanthology.org/2021.naacl-main.193/",
                'code': "https://github.com/zinengtang/DeCEMBERT"},
  "langflow": {'paper': "https://aclanthology.org/2021.acl-long.355/",
                'code': "https://github.com/zinengtang/ContinuousFlowNLG"},
  "color": {'paper': "https://dl.acm.org/doi/abs/10.1145/3357384.3358085"},
  "vidlankd": {'paper': "https://proceedings.neurips.cc/paper/2021/file/ccdf3864e2fa9089f9eca4fc7a48ea0a-Paper.pdf",
                'code': "https://github.com/zinengtang/VidLanKD"},
  "tvlt": {'paper': "https://arxiv.org/abs/2209.14156",
           'code': "https://github.com/zinengtang/TVLT"},
}

function add_link (title, link) {
  return `<a href="` + link + `" target="_blank">` + title + `</a>`;
}

function add_info (paper, infos) {
  var text = "";
  infos.forEach(info => {
    text += "[" + add_link(info, pub_dictionary[paper][info]) + "]";
  })
  return text;
}

function add_tag(tag) {
	if (tag==="paper") {
		return `<span class="badge badge-pill badge-paper">Paper</span>`;
	} else if (tag==="service") {
		return `<span class="badge badge-pill badge-service">Service</span>`;
	} else if (tag=="others") {
		return `<span class="badge badge-pill badge-others">Others</span>`;
	}
}

let intros = [
  `
  I am a fourth year undergraduate student majoring in Mathematics at the University of North Carolina at Chapel Hill.
  I am fortunate to be advised by [mohit] in [uncnlp], [murgelab].
  I have interned at Microsoft Research (in 2022) supervised by [ziyi].
  My primary research interests lie in the area of multi-modal learning, natural language processing, and machine learning.
  <br /><br />
  `
]

// let news = [
//   `10/2021: ` + add_tag("paper") + ` Our new preprint, ` + add_link("MetaICL: Learning to Learn In Context", pub_dictionary["min2021metaicl"]["paper"]) +
//   ` is out (w/ `+ add_link("code", pub_dictionary["min2021metaicl"]["code"]) + `).
//   Check out the ` + add_link("demo", pub_dictionary["min2021metaicl"]["demo"]) + `!`,
// ];


let publications = [
	["TVLT: Textless Vision-Language Transformer",
	 ["zineng*", "jaemin*", "yixin*", "mohit"],
	 "NeurIPS",
	 "",
	 "2022",
	 "tvlt"
	],
	["Vidlankd: Improving language understanding via video-distilled knowledge transfer",
	 ["zineng", "jaemin", "hao", "mohit"],
	 "NeurIPS",
	 "",
	 "2021",
	 "vidlankd"
	],
   ["Decembert: Learning from noisy instructional videos via dense captions and entropy minimization",
    ["zineng*", "jie*", "mohit"],
    "NAACL",
    "",
    "2021",
    "decembert"
   ],
   ["Continuous language generative flow",
    ["zineng", "shiyue", "hyounghun",  "mohit"],
    "ACL",
    "",
    "2021",
    "langflow"
   ],
   ["Dense-caption matching and frame-selection gating for temporal localization in VideoQA",
    ["hyounghun", "zineng", "mohit"],
    "ACL",
    "",
    "2020",
    "densecap"
   ],
   ["Deep colorization by variation",
    ["zineng", ],
    "ACL",
    "",
    "2019",
    "color"
   ],
];

let educations = [
  [
    "University of North Carlina at Chapel Hill",
	"08/2019&#8211;Current",
    // "08/2019&#8211;06/2023",
    [
      "B.S. in Mathematics",
    ],
  ],
];

let experiences = [
  [
    "University of North Carlina at Chapel Hill",
    "11/2019&#8211;Current",
    "Undergraduate research assistant",
    ["mohit"]
  ],
  [
    "Microsoft Research",
    "2022.06&#8211;08/2022",
    "Researche intern",
    ["ziyi"]
  ],
];

let demoIntro = ".";

let demos = [
    // ["2021", "Few-shot Learning",
    //  "Channel LM (" + add_link("paper", pub_dictionary["min2021noisy"]["paper"]) + ") + MetaICL (" + add_link("paper", pub_dictionary["min2021metaicl"]["paper"]) + ")",
    //  /*[["Channel LM Paper", pub_dictionary["min2021noisy"]["paper"]],
    //   ["Channel LM Code", pub_dictionary["min2021noisy"]["code"]],
    //   ["MetaICL Paper", pub_dictionary["min2021metaicl"]["paper"]],
    //   ["MetaICL Code", pub_dictionary["min2021metaicl"]["code"]]
    //  ]*/
    // ],
  ];

let honors = [
  "NeurIPS 2022 Scholar Award",
  "Honorable Mention, Outstanding Undergraduate Researcher Award 2022."
  + "<a href='https://cra.org/crn/' target='_blank'>Computing Research Association (CRA)</a> (2022)",
];

let services = [
];

let talks = [
];


let teaching = [
];









