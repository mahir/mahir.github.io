var nodes = null;
var edges = null;
var network = null;

function draw(csvdata) {
  var nodes = []
  var edges = []
  for (var i = 0; i < csvdata.length; i++) {
    nodes.push({"id":i, "label":csvdata[i]['f_name'], group: Math.floor(Math.random() * 3)})

    // console.log()

    for (var j = 0; j < csvdata.length; j++) {
      let randomNum = Math.random() * 10;
      if (i!=j && randomNum >= 9.7 ) {
        edges.push({"from": i, to: j, value: Math.floor(Math.random() * 5)})
      }
    }
  }


  
  // create people.
  // var nodes = [
  //   { id: 76, label: "Mme.Hucheloup", group: 4, value: 30 }];

  // create some edges
  // var edges = [
  //   { from: 76, to: 58, value: 13 }
  // ];
  
  // Instantiate our network object.
  var container = document.getElementById("mynetwork");
  var data = {
    nodes: nodes,
    edges: edges,
  };
  var options = {
    // interaction: { hover: true },
    physics: {
      forceAtlas2Based: {
        gravitationalConstant: -26,
        centralGravity: 0.005,
        springLength: 230,
        springConstant: 0.18,
      },
      maxVelocity: 146,
      solver: "forceAtlas2Based",
      timestep: 0.35,
      stabilization: { iterations: 150 },
    },
    nodes: {
      shape: "dot",
      font: {
      size: 18,
      color: "#ffffff",
    },
      scaling: {
        customScalingFunction: function (min, max, total, value) {
          return value / total;
        },
        min: 5,
        max: 150,
      },
    },
  };
  network = new vis.Network(container, data, options);

  network.on("click", function (params) {
    if(params.nodes.length>0) {
      let nd = csvdata[params.nodes[0]]
      // console.log(csvdata[nd])
      let pic_url = nd['pic']
      pic_url = pic_url.replace('https://formfacade.com/uploaded/', '')
      pic_url = pic_url.replaceAll('/', '_')
      pic_url = pic_url.replace('.jpg', '.jpeg')
      pic_url = pic_url.replace('.JPG', '.jpeg')

      let work_url = nd['k_upload']
      work_url = work_url.replace('https://formfacade.com/uploaded/', '')
      work_url = work_url.replaceAll('/', '_')
      work_url = work_url.replace('.jpg', '.jpeg')
      work_url = work_url.replace('.JPG', '.jpeg')

      if (pic_url != "") {
        document.getElementById("p_pic").innerHTML = '<img src=data/'+pic_url+' width="200px">'}
      else {
        document.getElementById("p_pic").innerHTML = ""
      }
      if (work_url != "") {
        document.getElementById("p_work").innerHTML = '<img src=data/'+work_url+' width="1000px">'
      }
      else {
        document.getElementById("p_work").innerHTML = ""
      }
      document.getElementById("p_name").innerText = nd['f_name'] + ' ' + nd['l_name']
      document.getElementById("p_bio").innerText = nd['bio']
      document.getElementById("p_q1").innerText = nd['q1']
      document.getElementById("p_q2").innerText = nd['q2']
      document.getElementById("p_q3").innerText = nd['q3']
      document.getElementById("p_q4").innerText = nd['q4']
      
      // <img src="works/johannes_poell/PIC_Johannes_Poell_2021_1000x1000.jpg" width="200px">
      document.getElementById("content").style.display = "block"
    }
    // params.event = "[original event]";
    // document.getElementById("eventSpanHeading").innerText = "Click event:";
    
    // document.getElementById("content").innerText = "test"
    // console.log("click event, getNodeAt returns: " + this.getNodeAt(params.pointer.DOM));
});
}

window.addEventListener("load", () => {
  // console.log('test')
  d3.csv("https://docs.google.com/spreadsheets/d/e/2PACX-1vTb0GBlDrAtnNW2d5XWGyOHLlCGL_hvJ80Zl3MCONsj1wWvz4xDbD00O7MQtH1ojP24_Uxj1N-P92Lh/pub?gid=2065692989&single=true&output=csv").then(function(csvdata) {
    // for (var i = 0; i < data.length; i++) {
    //   const parseTime = d3.timeParse("%d/%m/%Y");
    //   console.log(parseTime(data[i]['start']));
    // }
  draw(csvdata);
});
});
